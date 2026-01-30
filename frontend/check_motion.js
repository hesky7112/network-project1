const motion = require('framer-motion');
console.log('MOTION:', typeof motion.motion);
if (typeof motion.motion === 'undefined') {
    console.log('MOTION IS UNDEFINED');
} else {
    console.log('MOTION IS VALID');
}
