/*
Dibuat oleh: Zass Desuta
Kontak: https://zass.cloud
YouTube: NeoShiroko Labs

[  !  ] Jangan hapus wm ini ya friend 
*/

import fetch from "node-fetch";
import crypto from "crypto";

const API_ID = global.ch2h.api_id;
const API_KEY = global.ch2h.apikey;
const BASE_URL = "https://vip-reseller.co.id/api/prepaid";

function generateSign() {
  return crypto.createHash("md5").update(API_ID + API_KEY).digest("hex");
}

export async function h2h_getServices(filterType = "", filterValue = "") {
  const sign = generateSign();
  const form = new URLSearchParams({
    key: API_ID,
    sign,
    type: "services"
  });
  if (filterType) form.append("filter_type", filterType);
  if (filterValue) form.append("filter_value", filterValue);

  const res = await fetch(BASE_URL, { method: "POST", body: form });
  return await res.json();
}

export async function h2h_createOrder(serviceCode, targetNo) {
  const sign = generateSign();
  const form = new URLSearchParams({
    key: API_ID,
    sign,
    type: "order",
    service: serviceCode,
    data_no: targetNo
  });

  const res = await fetch(BASE_URL, { method: "POST", body: form });
  return await res.json();
}

export async function h2h_checkStatus(trxid) {
  const sign = generateSign();
  const form = new URLSearchParams({
    key: API_ID,
    sign,
    type: "status",
    trxid
  });

  const res = await fetch(BASE_URL, { method: "POST", body: form });
  return await res.json();
}