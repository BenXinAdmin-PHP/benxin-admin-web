/*
 * +----------------------------------------------------------------------
 * | @project   BenXinAdmin
 * | @mission   支付订单接口（只读 + 退款 — /admin/v1/pay-orders）
 * | @author    仗键天涯(daxing)
 * | @email     3442535897@qq.com
 * | @date      2026-06-14
 * +----------------------------------------------------------------------
 */
import { request, type ApiEnvelope, type PageResult } from '@/utils/request'

/** 支付订单行（status：0待支付 1已支付 2已退款 3部分退款 4已关闭 5支付失败；amount 单位分） */
export interface PayOrderItem {
  id: number
  tenant_id: number
  order_no: string
  out_trade_no: string
  channel: string
  trade_type: string
  subject: string
  amount: number
  status: number
  openid: string
  transaction_id: string
  attach: string
  notify_data: string
  refunded_amount: number
  paid_at: string | null
  expire_at: string | null
  user_id: number
  biz_type: string
  biz_id: string
  created_at: string | null
  updated_at: string | null
}

/** GET /admin/v1/pay-orders —— 分页列表（order_no/channel/status/biz_type/时间范围筛选） */
export function listPayOrders(
  params: Record<string, unknown>,
): Promise<ApiEnvelope<PageResult<PayOrderItem>>> {
  return request<PageResult<PayOrderItem>>({ url: '/v1/pay-orders', method: 'get', params })
}

/** GET /admin/v1/pay-orders/:id —— 详情（含退款记录） */
export function getPayOrder(id: number): Promise<ApiEnvelope<PayOrderItem>> {
  return request<PayOrderItem>({ url: `/v1/pay-orders/${id}`, method: 'get' })
}

/**
 * POST /admin/v1/pay-orders/:id/refund —— 退款（敏感操作，confirm 必须为 '1' 二次确认）。
 * amount 单位分（>0），reason 可空。
 */
export function refundPayOrder(
  id: number,
  data: { amount: number; reason?: string; confirm: string },
): Promise<ApiEnvelope<{ refund_no: string; out_refund_no: string; amount: number; status: number }>> {
  return request({ url: `/v1/pay-orders/${id}/refund`, method: 'post', data })
}
