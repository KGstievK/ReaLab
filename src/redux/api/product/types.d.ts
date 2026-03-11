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
}
