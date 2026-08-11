import { NextResponse } from "next/server";
import { listLots, listLotTypes } from "../../../lib/queries";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const zone = searchParams.get("zone") || undefined;
  const lotType = searchParams.get("lotType") || undefined;
  const minPriceUsd = searchParams.get("minPriceUsd") ? Number(searchParams.get("minPriceUsd")) : undefined;
  const maxPriceUsd = searchParams.get("maxPriceUsd") ? Number(searchParams.get("maxPriceUsd")) : undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 60;
  const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : 0;

  const { total, lots } = listLots({ zone, lotType, minPriceUsd, maxPriceUsd, limit, offset });

  return NextResponse.json({ total, lots, lotTypes: listLotTypes() });
}
