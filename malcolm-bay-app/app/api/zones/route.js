import { NextResponse } from "next/server";
import { listZones, getPortfolioStats } from "../../../lib/queries";

export async function GET() {
  return NextResponse.json({
    zones: listZones(),
    portfolio: getPortfolioStats(),
  });
}
