// Free-shipping policy. The backend enforces it through an automatic `free_shipping`
// discount with minOrderValue = FREE_SHIPPING_MIN (glitteron-prod docs/discounts/DESIGN.md).
// Change both together, plus /shipping and the FAQ copy that quotes FREE_SHIPPING_MIN_LABEL.
export const FREE_SHIPPING_MIN = 5000
export const FREE_SHIPPING_MIN_LABEL = '₹5,000'
