import { apiClient } from "@/api/client";
import type { DrfPaginated } from "@/types/laboratory";
import type { FinancialRecord, PaymentStatus } from "@/types/laboratory";

const BASE = "/api/laboratory/financial-records/";

export async function fetchFinancialRecords(params?: {
  page?: number;
  search?: string;
  payment_status?: PaymentStatus;
  job?: string;
}): Promise<DrfPaginated<FinancialRecord>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.payment_status) query.payment_status = params.payment_status;
  if (params?.job) query.job = params.job;
  const { data } = await apiClient.get<DrfPaginated<FinancialRecord>>(BASE, {
    params: query,
  });
  return data;
}

export async function fetchFinancialRecord(
  invoiceNo: string,
): Promise<FinancialRecord> {
  const { data } = await apiClient.get<FinancialRecord>(`${BASE}${invoiceNo}/`);
  return data;
}

export async function createFinancialRecord(body: {
  job: string;
  amount_expected?: string;
  amount_paid?: string;
  payment_status?: PaymentStatus;
}): Promise<FinancialRecord> {
  const { data } = await apiClient.post<FinancialRecord>(BASE, body);
  return data;
}

export async function patchFinancialRecord(
  invoiceNo: string,
  body: Partial<{
    amount_expected: string;
    amount_paid: string;
    payment_status: PaymentStatus;
  }>,
): Promise<FinancialRecord> {
  const { data } = await apiClient.patch<FinancialRecord>(
    `${BASE}${invoiceNo}/`,
    body,
  );
  return data;
}

export async function deleteFinancialRecord(invoiceNo: string): Promise<void> {
  await apiClient.delete(`${BASE}${invoiceNo}/`);
}
