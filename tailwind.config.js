module.exports = {
  // ...existing code...
  theme: {
    extend: {
      // ...existing extensions...
      keyframes: {
        blink: {
          "0%, 100%": { opacity: 0 },
          "50%": { opacity: 1 },
        },
      },
      animation: {
        blink: "blink 1s infinite",
      },
    },
  },
  // ...existing code...
};
