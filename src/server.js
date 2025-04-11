import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

const shortCode = process.env.MPESA_SHORTCODE;
const passkey = process.env.MPESA_PASSKEY;
const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const callbackURL = process.env.MPESA_CALLBACK_URL;

// Generate Access Token
const getToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const { data } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return data.access_token;
};

// STK Push
app.post("/mpesa/stk", async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const token = await getToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    const stkPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackURL,
      AccountReference: "HumanLine",
      TransactionDesc: "Chat Access Payment"
    };

    const { data } = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkPayload,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data.ResponseCode === "0") {
      return res.json({ success: true, message: "STK Push sent" });
    } else {
      return res.json({ success: false, message: data.ResponseDescription });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ success: false, message: "STK Push failed" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
