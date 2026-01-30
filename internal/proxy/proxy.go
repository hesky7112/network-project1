package proxy

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"

	"net"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

// DeviceProxy handles proxying requests to managed devices
type DeviceProxy struct {
	// Add mapping or cache if needed
}

func NewDeviceProxy() *DeviceProxy {
	return &DeviceProxy{}
}

// ProxyToDevice proxies the request to a device's IP
func (p *DeviceProxy) ProxyToDevice(c *gin.Context, deviceIP string, targetPort int) {
	target, err := url.Parse(fmt.Sprintf("http://%s:%d", deviceIP, targetPort))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid device address"})
		return
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	// King Tier Performance: Custom Transport with Socket Tuning
	proxy.Transport = &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
			Control: func(network, address string, c syscall.RawConn) error {
				return c.Control(func(fd uintptr) {
					// TCP_NODELAY: Disable Nagle's algorithm for instant packet delivery
					// Cast fd to syscall.Handle for Windows compatibility
					syscall.SetsockoptInt(syscall.Handle(fd), syscall.IPPROTO_TCP, syscall.TCP_NODELAY, 1)
				})
			},
		}).DialContext,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}

	// Update the headers to allow for SSL redirection and correct host headers
	proxy.Director = func(req *http.Request) {
		req.Header = c.Request.Header
		req.Host = target.Host
		req.URL.Scheme = target.Scheme
		req.URL.Host = target.Host

		// Handle path stripping if necessary
		path := c.Param("proxyPath")
		req.URL.Path = path
	}

	proxy.ServeHTTP(c.Writer, c.Request)
}

// GetProxyPath extracts the path to be forwarded to the device
func GetProxyPath(c *gin.Context) string {
	path := c.Param("proxyPath")
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return path
}
