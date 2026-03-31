export default defineConfig({
  plugins: [react()],
  base: "/UXINAI/", // <--- هنا مكانها الصح يا بطل!
  test: {
    // باقي الإعدادات...
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
