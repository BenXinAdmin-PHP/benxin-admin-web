/* 后台首页业务统计接口。 */
import { request, type ApiEnvelope } from '@/utils/request'

export interface DashboardStats {
  visible_admins: number
  my_logins_today: number
}

export function getDashboardStats(): Promise<ApiEnvelope<DashboardStats>> {
  return request<DashboardStats>({ url: '/v1/admins/dashboard-stats', method: 'get', silent: true })
}
