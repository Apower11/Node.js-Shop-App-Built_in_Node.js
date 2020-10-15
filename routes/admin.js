const express = require("express");
const path = require("path");
const { check, body } = require("express-validator");
const Product = require("../models/product");

const productsController = require("../controllers/products");

const adminController = require("../controllers/admin");

const isAuth = require("../middleware/is-auth");

const router = express.Router();





router.get("/admin/add-product", isAuth, adminController.getAddProduct);

router.get("/admin/products", isAuth, adminController.adminProducts);

router.post("/admin/product", isAuth,
 [body('title')
 .isString()
 .isLength({min: 3})
 .trim(),
 body('price')
 .isFloat()
 .withMessage("Your price must be number")
 ,
 body("description")
  .isLength({min: 5, max: 400})
  .trim()
 

 


 ],
 adminController.postAddProduct);



router.get("/admin/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post("/admin/edit-product", isAuth,
[check('title')
 .isString()
 .withMessage('Your title can only contain numbers and letters')
 .custom((value, { req }) => {

    return Product.findOne({ title: value })
    .then(productDoc => {
        console.log(value);
        if(productDoc){
            return Promise.reject(
                'There is another product with this title already, choose a different one.'
            );
        }
    })
 })
 .trim(),
 check('price')
 .toFloat()
 .isFloat()
 .withMessage("Your price must be number")
 ,
 body("description")
  .isLength({min: 5, max: 400})
  .trim()
 

 


 ],
adminController.postEditProduct);

router.delete("/admin/product/:productId", isAuth, adminController.deleteProduct);

module.exports = router;