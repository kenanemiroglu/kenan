
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post("/api/getOrders", async (req, res) => {
  const { apiKey, apiSecret, supplierId, startDate, endDate } = req.body;

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const size = 200;
  let page = 0;
  let allOrders = [];
  let totalPages = 1;

  const start = new Date(startDate).getTime();
  const endT = new Date(endDate).getTime();

  try {
    while (page < totalPages) {
      const url = `https://api.trendyol.com/sapigw/suppliers/${supplierId}/orders?startDate=${start}&endDate=${endT}&page=${page}&size=${size}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });

      const orders = response.data.content;
      totalPages = response.data.totalPages;
      allOrders = allOrders.concat(orders);
      page++;
    }

    res.json({ success: true, data: allOrders });
  } catch (err) {
    console.error("❌ Hata:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${port}`);
});
