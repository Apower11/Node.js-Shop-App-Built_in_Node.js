const fs = require("fs");
const path = require("path");
const http = require("http");
const PDFDocument = require("pdfkit");
const stripe = require('stripe')(process.env.STRIPE_KEY);

const Product = require("../models/product");
const Order = require("../models/order");

const ITEMS_PER_PAGE = 1;

exports.getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
    pageTitle: "Add an item in pug",
    path: "/admin/add-product",
    editing: false,
    activeAddProduct: true,
    isAuthenticated: req.session.isLoggedIn
})
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = parseFloat(req.body.price);
    const description = req.body.description;
    const product = new Product(title, imageUrl, description, price);
    product.save();
    res.redirect('/admin/edit-product');
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode) {
        res.redirect("/")
    }
    const prodId = req.params.productId;
    Product.findById(prodId, product => {
        if (!product) {
            return res.redirect("/");
        }
        res.render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            isAuthenticated: req.session.isLoggedIn,
            product: product})
    });
    };
        
    


exports.productsHome = (req, res, next) => {
   

     
    const products = Product.fetchAll()
    .then(products => {
        res.render('shop/product-list', {
            pageTitle: "Shop Home Page", 
            prods: products, 
            path: "/", 
            hasProduct: products.length > 0,
            activeShop: true,
            isAuthenticated: req.session.isLoggedIn
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

    };

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId).then(product => {
        res.render("shop/product-detail", {
            product: product,
            pageTitle: product.title,
            path: "/products",
            isAuthenticated: req.session.isLoggedIn
    });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
        
};

exports.products = (req, res, next) => {
    const page = +req.query.page || 1;
    return Product.find()
    .countDocuments()
    .then(numProducts => {
        totalItems = numProducts;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products => {
        res.render("shop/product-list", {
            prods: products,
            pageTitle: "Shop - Products",
            path: "/product-list",
            isAuthenticated: req.session.isLoggedIn,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
    
};

exports.index = (req, res, next) => {
    Product.find()
    .then(products => {
        res.render("shop/index", {
            prods: products,
            pageTitle: "Shop - Home",
            path: "/index",
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.cart = (req, res, next) => {
    
    req.user
    .populate('cart.items.productId')
    .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render("shop/cart", {
                pageTitle: "Shop - Cart",
                path: "/cart",
                products: products,
                isAuthenticated: req.session.isLoggedIn
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    };
    // Cart.getCart(cart => {
    //     Product.fetchAll(products => {
    //         const cartProducts = [];
    //         for(product of products) {
    //             const cartProductData = cart.products.find(prod => prod.id === product.id);
    //             if(cart.products.find(prod => prod.id === product.id)) {
    //                 cartProducts.push({ productData: product, qty: cartProductData.qty});
    //             }
    //         }
    //         res.render("shop/cart", {
    //             pageTitle: "Shop - Cart",
    //             path: "/cart",
    //             products: cartProducts
    //         })
    //     });
        
    // })
        


exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
    .then(product => {
        return req.user.addToCart(product);
    })
    .then(result => {
        res.redirect("/cart")
    });
    // let fetchedCart;
    // req.user.getCart()
    // .then(cart => {
    //     fetchedCart = cart;
    //     return cart.getProducts({ where: {id: prodId }});
    // })
    // .then(products => { 
    //     let product;
    //     if(products.length > 0) {
    //         product = products[0];
    //     }
    //     let newQuantity = 1;
    //     if(product) {
    //         const oldQuantity = product.cartItem.quantity;
    //         const newQuantity = oldQuantity + 1;
    //         return fetchedCart.addProduct(product, 
    //             {through: { quantity: newQuantity }})
    //             .then(() => {
    //                 res.redirect("/cart")
    //             })
    //             .catch(err => console.log(err))
    //     }
    //     return Product.findByPk(prodId)
    //     .then(product => {
    //         return fetchedCart.addProduct(product, {
    //             through: { quantity: newQuantity }
    //         });
    //     })
    //     .then(() => {
    //         res.redirect("/cart");
    //     })
    //     .catch(err => console.log(err))
    // })
    // .catch(err => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeFromCart(prodId)
    .then(result => {
        res.redirect("/cart");
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.adminProducts = (req, res, next) => {
    Product.fetchAll(products => {
        res.render("admin/products", {
            prods: products,
            pageTitle: "Admin - Products",
            path: "/admin/products",
            isAuthenticated: req.session.isLoggedIn
        })
    })
};

exports.orders = (req, res, next) => {
        Order.find( { 'user.userId': req.user._id} )
        .then(orders => {
        res.render("shop/orders", 
        {
        pageTitle: "Shop - Orders",
        path: "/orders",
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
        })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
        };

    exports.getCheckout = (req, res, next) => {
        let products;
        let total = 0;
        req.user
        .populate('cart.items.productId')
        .execPopulate()
            .then(user => {
                products = user.cart.items;
                total = 0;
                products.forEach(p => {
                    total += p.quantity * p.productId.price;
                });

                return stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: products.map(p => {
                        console.log(req.protocol + "://" + req.get("host") + "/checkout/success")
                        return {
                            name: p.productId.title,
                            description: p.productId.description,
                            amount: p.productId.price * 100,
                            currency: 'gbp',
                            quantity: p.quantity
                        }
                    }),
                    success_url: req.protocol + "://" + req.get('host') + "/checkout/success",
                    cancel_url: req.protocol + "://" + req.get('host') + "/checkout/cancel"
                })
            })
                .then(session => {
                    res.render("shop/checkout", {
                        pageTitle: "Shop - Checkout",
                        path: "/checkout",
                        products: products,
                        isAuthenticated: req.session.isLoggedIn,
                        totalSum: total,
                        sessionId: session.id
                    });
                }) 
            
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    }

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
      .populate('cart.items.productId')
      .execPopulate()
      .then(user => {
          const products = user.cart.items.map(i => {
              return { title: i.title, quantity: i.quantity, product: { ...i.productId._doc } }
          })
          const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user
            },
            products: products
        });
        return order.save()
      })
      .then(result => {
          return req.user.clearCart()
      })
      .then(result => {
        res.redirect("/orders");
      })


      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });    
}

exports.postCreateOrder = (req, res, next) => {
      req.user
      .populate('cart.items.productId')
      .execPopulate()
      .then(user => {
          const products = user.cart.items.map(i => {
              return { title: i.title, quantity: i.quantity, product: { ...i.productId._doc } }
          })
          const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user
            },
            products: products
        });
        return order.save()
      })
      .then(result => {
          return req.user.clearCart()
      })
      .then(result => {
        res.redirect("/cart");
      })


      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });    
}

exports.checkoutSuccess = (req, res, next) => {
    req.user
      .populate('cart.items.productId')
      .execPopulate()
      .then(user => {
          const products = user.cart.items.map(i => {
              return { title: i.title, quantity: i.quantity, product: { ...i.productId._doc } }
          })
          const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user
            },
            products: products
        });
        return order.save()
      })
      .then(result => {
          return req.user.clearCart()
      })
      .then(result => {
        res.redirect("/cart");
      })


      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });  
}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
    .then(order => {
        if (!order) {
            return next(new Error("No orders found."))
        }
        if(order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error("Unauthorized"));
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName);
    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text("Invoice", {
        underline: true,
    });
    pdfDoc.text("------------------");
    totalPrice = 0;
    order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc.fontSize(15).text(
         `${prod.product.title} - ${prod.quantity} x £${prod.product.price}`
        );
    });
    pdfDoc.text("-----");
    pdfDoc.text(`Total Price: £${totalPrice}`);
    pdfDoc.end();
    // fs.readFile(invoicePath, (err, data) => {
    //     if (err) {
    //         return next(err);
    //     }
    //     res.setHeader('Content-Type', 'application/pdf');
    //     res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
    //     res.send(data);
    // });


    // const file = fs.createReadStream(invoicePath);
   
    // file.pipe(res);
    // })
    // .catch(err => {
    //     next(err);
    // })
    })
};

        
