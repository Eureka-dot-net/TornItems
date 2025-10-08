export interface ItemSold {
  Amount: number;
  TimeStamp: string;
  Price: number;
}

export interface TravelStatus {
  destination: string;
  method: string;
  departed_at: number;
  arrival_at: number;
  time_left: number;
}

export interface CountryItem {
  id: number;
  name: string;
  buy_price: number | null;
  market_price: number | null;
  profitPer1: number | null;
  shop_name: string | null;
  country?: string | null;
  country_code?: string | null;
  shop_url_name?: string | null;
  in_stock?: number | null;
  sales_24h_current?: number | null;
  sales_24h_previous?: number | null;
  trend_24h?: number | null;
  hour_velocity_24?: number | null;
  average_price_items_sold?: number | null;
  ItemsSold?: ItemSold[];
  estimated_market_value_profit: number | null;
  lowest_50_profit: number | null;
  sold_profit: number | null;
  sellout_duration_minutes?: number | null;
  cycles_skipped?: number | null;
  last_restock_time?: string | null;
  next_estimated_restock_time?: string | null;
  travel_time_minutes?: number | null;
  profit_per_minute?: number | null;
  boarding_time?: string | null;
}

export interface GroupedByCountry {
  [country: string]: CountryItem[];
}

export interface ProfitData {
  count: number;
  countries: number;
  max_foreign_items: number;
  travel_status: TravelStatus | null;
  results: GroupedByCountry;
}
