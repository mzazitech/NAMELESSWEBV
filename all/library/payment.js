/*
Dibuat oleh: Zass Desuta
Kontak: https://zass.cloud
YouTube: NeoShiroko Labs

[  !  ] Jangan hapus wm ini ya friend 
*/

import fetch from "node-fetch"

const BASE_URL = "https://app.pakasir.com/api"

const PROJECT = global.pay.project
const API_KEY = global.pay.apikey

/**
 * Create payment
 */
export async function createPayment(order_id, amount) {
  const res = await fetch(`${BASE_URL}/transactioncreate/qris`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      project: PROJECT,
      order_id,
      amount,
      api_key: API_KEY
    })
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || "Create payment gagal")

  return json.payment
}

/**
 * Check payment status
 */
export async function checkPayment(order_id, amount) {
  const url =
    `${BASE_URL}/transactiondetail` +
    `?project=${PROJECT}` +
    `&amount=${amount}` +
    `&order_id=${order_id}` +
    `&api_key=${API_KEY}`

  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || "Cek payment gagal")

  return json.transaction
}

/**
 * Cancel payment
 */
export async function cancelPayment(order_id, amount) {
  const res = await fetch(`${BASE_URL}/transactioncancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      project: PROJECT,
      order_id,
      amount,
      api_key: API_KEY
    })
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || "Cancel payment gagal")

  return json
}