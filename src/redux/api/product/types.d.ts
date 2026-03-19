namespace PRODUCT {
  type getBasketRes = cart[];
  type getBasketReq = void;

  type getCartItemRes = get_cart_item;
  type getCartItemReq = number;

  type addToBasketRes = {
    success: boolean;
    total_price: string;
  };
  type addToBasketReq = post_cart_item;

  type editBasketRes = cart;
  type editBasketReq = {
    id?: number;
    updateBasket: patch_cart_item;
  };

  type deleteBasketRes = {
    success: boolean;
    id: number;
    total_price: string;
  };
  type deleteBasketReq = number;

  type getAllCartRes = AllCart;
  type getAllCartReq = void;

  type getAboutRes = AboutUs[];
  type getAboutReq = void;

  type postOrderRes = IOrder;
  type postOrderReq = IOrderPost;

  type getOrderRes = IOrder[];
  type getOrderReq = void;

  type getPayRes = Pay;
  type getPayReq = void;

  type getPaymentMethodsRes = PaymentMethodOption[];
  type getPaymentMethodsReq = void;

  type getPaymentSessionRes = PaymentSessionContract;
  type getPaymentSessionReq = number;

  type getShippingQuoteRes = {
    delivery_method: "courier" | "pickup";
    price: number;
    currency: string;
    carrier: string;
    service_name: string;
    eta_label: string;
    city: string;
    country: string;
    is_estimated: boolean;
    is_live_rate: boolean;
    quote_source: "pickup" | "city_matrix" | "country_estimate";
    warning: string | null;
  };
  type getShippingQuoteReq = {
    delivery: "курьер" | "самовывоз";
    city?: string;
    country?: string;
    payment_method?: "mbank_redirect" | "finca_qr" | "manual";
  };
}

