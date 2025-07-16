
const express = require("express");
const axios = require("axios");
const ExcelJS = require("exceljs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { apiKey, apiSecret, supplierId, startDate, endDate } = req.body;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const start = new Date(startDate).getTime();
  const endT = new Date(endDate).getTime();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Siparişler");
  sheet.columns = [
    { header: "Tarih", key: "date" },
    { header: "Ürün", key: "product" },
    { header: "Satış Fiyatı", key: "price" },
    { header: "Görsel Link", key: "image" },
    { header: "Net Kâr", key: "net" },
  ];

  let page = 0;
  const size = 200;
  let totalPages = 1;

  try {
    while (page < totalPages) {
      const url = \`https://api.trendyol.com/sapigw/suppliers/\${supplierId}/orders?startDate=\${start}&endDate=\${endT}&page=\${page}&size=\${size}\`;
      const response = await axios.get(url, {
        headers: { Authorization: \`Basic \${auth}\` }
      });

      const orders = response.data.content;
      totalPages = response.data.totalPages;

      for (let order of orders) {
        for (let item of order.lines) {
          const name = item.productName;
          const satis = item.price;
          const kargo = 20;
          const alis = 100;
          const kom = satis * 0.20;
          const kdv = satis - satis / 1.18;
          const net = satis - kom - kargo - kdv - alis;
          const image = item.productUrl ? \`https://www.trendyol.com\${item.productUrl}\` : "";

          sheet.addRow({
            date: order.orderDate,
            product: name,
            price: satis,
            image: image,
            net: Math.round(net * 100) / 100
          });
        }
      }

      page++;
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=kar_hesaplama.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Veri çekilemedi" });
  }
});

app.listen(3000, () => console.log("✅ Sunucu çalışıyor http://localhost:3000"));
