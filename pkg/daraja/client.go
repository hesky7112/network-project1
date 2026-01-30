package daraja

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	SandboxURL    = "https://sandbox.safaricom.co.ke"
	ProductionURL = "https://api.safaricom.co.ke"
)

type Config struct {
	ConsumerKey       string
	ConsumerSecret    string
	BusinessShortCode string
	PassKey           string
	CallbackURL       string
	Mode              string // "sandbox" or "production"
}

type Client struct {
	config     Config
	httpClient *http.Client
}

func NewClient(config Config) *Client {
	return &Client{
		config: config,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) getBaseURL() string {
	if c.config.Mode == "production" {
		return ProductionURL
	}
	return SandboxURL
}

type AuthResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   string `json:"expires_in"`
}

func (c *Client) GetAccessToken() (string, error) {
	url := fmt.Sprintf("%s/oauth/v1/generate?grant_type=client_credentials", c.getBaseURL())
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	auth := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:%s", c.config.ConsumerKey, c.config.ConsumerSecret)))
	req.Header.Set("Authorization", "Basic "+auth)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("auth failed with status %d: %s", resp.StatusCode, string(body))
	}

	var authResp AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return "", err
	}

	return authResp.AccessToken, nil
}

type STKPushRequest struct {
	BusinessShortCode string `json:"BusinessShortCode"`
	Password          string `json:"Password"`
	Timestamp         string `json:"Timestamp"`
	TransactionType   string `json:"TransactionType"` // "CustomerPayBillOnline"
	Amount            int    `json:"Amount"`
	PartyA            string `json:"PartyA"` // Phone number
	PartyB            string `json:"PartyB"` // BusinessShortCode
	PhoneNumber       string `json:"PhoneNumber"`
	CallBackURL       string `json:"CallBackURL"`
	AccountReference  string `json:"AccountReference"`
	TransactionDesc   string `json:"TransactionDesc"`
}

type STKPushResponse struct {
	MerchantRequestID   string `json:"MerchantRequestID"`
	CheckoutRequestID   string `json:"CheckoutRequestID"`
	ResponseCode        string `json:"ResponseCode"`
	ResponseDescription string `json:"ResponseDescription"`
	CustomerMessage     string `json:"CustomerMessage"`
}

func (c *Client) InitiateSTKPush(phoneNumber string, amount int, reference, description string) (*STKPushResponse, error) {
	token, err := c.GetAccessToken()
	if err != nil {
		return nil, fmt.Errorf("failed to get access token: %w", err)
	}

	timestamp := time.Now().Format("20060102150405")
	password := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s%s%s", c.config.BusinessShortCode, c.config.PassKey, timestamp)))

	reqBody := STKPushRequest{
		BusinessShortCode: c.config.BusinessShortCode,
		Password:          password,
		Timestamp:         timestamp,
		TransactionType:   "CustomerPayBillOnline",
		Amount:            amount,
		PartyA:            phoneNumber,
		PartyB:            c.config.BusinessShortCode,
		PhoneNumber:       phoneNumber,
		CallBackURL:       c.config.CallbackURL,
		AccountReference:  reference,
		TransactionDesc:   description,
	}

	jsonBody, _ := json.Marshal(reqBody)
	url := fmt.Sprintf("%s/mpesa/stkpush/v1/processrequest", c.getBaseURL())

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("stk push failed with status %d: %s", resp.StatusCode, string(body))
	}

	var stkResp STKPushResponse
	if err := json.NewDecoder(resp.Body).Decode(&stkResp); err != nil {
		return nil, err
	}

	return &stkResp, nil
}

type StkCallback struct {
	MerchantRequestID string `json:"MerchantRequestID"`
	CheckoutRequestID string `json:"CheckoutRequestID"`
	ResultCode        int    `json:"ResultCode"`
	ResultDesc        string `json:"ResultDesc"`
	CallbackMetadata  struct {
		Item []CallbackItem `json:"Item"`
	} `json:"CallbackMetadata"`
}

type CallbackItem struct {
	Name  string      `json:"Name"`
	Value interface{} `json:"Value,omitempty"`
}

type CallbackData struct {
	Body struct {
		StkCallback StkCallback `json:"stkCallback"`
	} `json:"Body"`
}
