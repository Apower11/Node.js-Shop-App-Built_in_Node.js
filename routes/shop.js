const express = require("express");
const path = require("path");

const router = express.Router();
const adminData = require("./admin");
const isAuth = require("../middleware/is-auth");

const productsController = require("../controllers/products");

/*
router.get("/", (req, res, next) => {
    console.log(adminData.products);
    res.sendFile(path.join(__dirname, "..", "views/shop.html"));
});
*/





router.get("/product-list", productsController.products);

router.get("/", productsController.index);

router.get("/cart", isAuth, productsController.cart);

router.post("/cart", isAuth, productsController.postCart)

router.post("/cart-delete-item", isAuth, productsController.postCartDeleteProduct);

router.get("/checkout", isAuth, productsController.getCheckout);

router.get("/checkout/success", productsController.getCheckoutSuccess);

router.get("/checkout/cancel", productsController.getCheckout);

router.get("/products/delete");

router.get("/products/:productId", productsController.getProduct);

router.get("/orders", isAuth, productsController.orders);

router.get("/orders/:orderId", isAuth, productsController.getInvoice);

// router.post("/create-order", isAuth, productsController.postCreateOrder)


module.exports = router;