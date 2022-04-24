const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController")
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")
const mid = require("../middlewares/auth")




router.post("/register", userController.createUser)
router.post("/login", userController.loginUser)
router.get("/user/:userId/profile",mid.authentication, mid.authorization, userController.getUserDetails)
router.put("/user/:userId/profile",mid.authentication,mid.authorization, userController.updateUserDetails)
router.post("/products", productController.createProduct)
router.get("/product", productController.getFilterProduct)
router.get("/products/:productId", productController.getProductDetails)
router.put("/products/:productId", productController.updateProductDetails)
router.delete("/products/:productId", productController.deleteProduct)
router.post("/users/:userId/cart",mid.authentication,mid.authorization, cartController.createCart)
router.get("/users/:userId/cart",mid.authentication,mid.authorization, cartController.getCartDetails)
router.put("/users/:userId/cart/",mid.authentication,mid.authorization, cartController.updateCart)
router.delete("/users/:userId/cart",mid.authentication,mid.authorization, cartController.deleteCart)
router.post("/users/:userId/orders" ,mid.authentication,mid.authorization, orderController.createOrder)
router.put("/users/:userId/orders",mid.authentication,mid.authorization, orderController.updateOrder)





module.exports = router;