const express = require('express');
const router = express.Router();

const UserController = require("../controller/userController")
const Midd = require("../middleware/auth")
const ProductController = require("../controller/productController")
const CartController = require("../controller/cartController")



router.post("/register", UserController.createUser)
router.post("/login", UserController.loginUser)
router.get("/user/:userId/profile",Midd.authentication,UserController.getUserDetails)
router.put("/user/:userId/profile",Midd.authentication,Midd.authorization,UserController.updateUserDetails)

router.post("/products", ProductController.createProduct)
router.get("/product", ProductController.getFilterProduct)
router.get("/products/:productId", ProductController.getProductDetails)
router.put("/products/:productId", ProductController.updateProductDetails)
router.delete("/products/:productId", ProductController.deleteProduct)

router.post("/users/:userId/cart",Midd.authentication,Midd.authorization,CartController.createCart)


module.exports = router;