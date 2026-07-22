import { apiClient } from "@/api/client";
import type { CalibrationRecord, DrfPaginated } from "@/types/laboratory";

const BASE = "/api/laboratory/calibration-records/";

export async function fetchCalibrationRecords(params?: {
  page?: number;
  search?: string;
  analysis_result?: string;
}): Promise<DrfPaginated<CalibrationRecord>> {
  const query: Record<string, string | number> = {};
  if (params?.page && params.page > 0) query.page = params.page;
  if (params?.search?.trim()) query.search = params.search.trim();
  if (params?.analysis_result) query.analysis_result = params.analysis_result;
  const { data } = await apiClient.get<DrfPaginated<CalibrationRecord>>(BASE, {
    params: query,
  });
  return data;
}

export async function fetchCalibrationRecord(id: string): Promise<CalibrationRecord> {
  const { data } = await apiClient.get<CalibrationRecord>(`${BASE}${id}/`);
  return data;
}

export async function createCalibrationRecord(body: {
  analysis_result: string;
  instrument_name: string;
  calibration_reference?: string;
  calibration_date?: string | null;
  calibration_data?: Record<string, unknown>;
  notes?: string;
}): Promise<CalibrationRecord> {
  const { data } = await apiClient.post<CalibrationRecord>(BASE, body);
  return data;
}

export async function patchCalibrationRecord(
  id: string,
  body: Partial<{
    instrument_name: string;
    calibration_reference: string;
    calibration_date: string | null;
    calibration_data: Record<string, unknown>;
    notes: string;
  }>,
): Promise<CalibrationRecord> {
  const { data } = await apiClient.patch<CalibrationRecord>(`${BASE}${id}/`, body);
  return data;
}

export async function deleteCalibrationRecord(id: string): Promise<void> {
  await apiClient.delete(`${BASE}${id}/`);
}
