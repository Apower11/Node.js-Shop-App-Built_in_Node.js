const Product = require("../models/product");
const mongodb = require("mongodb");
const { validationResult } = require("express-validator");
const fileHelper = require("../util/file");
const ITEMS_PER_PAGE = 1;

exports.getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
    pageTitle: "Admin - Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: null,
    oldInput: {},
    validationErrors: []
})
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    
    const errors = validationResult(req);

    const ITEMS_PER_PAGE = 1;

    if(!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            oldInput: {
              title: title,
              price: price,
              description: description
            },
            errorMessage: "Attached file is not an image",
            validationErrors: errors.array()
          });
    }
  
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: true,
          oldInput: {
          title: title,
          price: price,
          description: description
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array()
      });
    }
  
    const imageUrl = image.path;
   
  
    const product = new Product({
      // _id: new mongoose.Types.ObjectId('5badf72403fd8b5be0366e81'),
      title: title,
      price: price,
      description: description,
      imageUrl: imageUrl,
      userId: req.user
    });
    product
      .save()
      .then(result => {
        // console.log(result);
        res.redirect('/admin/products');
      })
      .catch(err => {
        // return res.status(500).render('admin/edit-product', {
        //   pageTitle: 'Add Product',
        //   path: '/admin/add-product',
        //   editing: false,
        //   hasError: true,
        //   product: {
        //     title: title,
        //     imageUrl: imageUrl,
        //     price: price,
        //     description: description
        //   },
        //   errorMessage: 'Database operation failed, please try again.',
        //   validationErrors: []
        // });
        // res.redirect('/500');
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode) {
        res.redirect("/")
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {      
        if (!product) {
            return res.redirect("/");
        }
        res.render("admin/edit-product", {
            pageTitle: "Edit Product",
            path: "/admin/edit-product",
            editing: true,
            product: product,
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: null,
            validationErrors: [],
            oldInput: {}
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
    };

    exports.postEditProduct = (req, res, next) => {
               const prodId = req.body.productId;
               const updatedTitle = req.body.title;
               const image = req.file;
               const updatedPrice = req.body.price;
               const updatedDesc = req.body.description;

               const errors = validationResult(req);

                if(!errors.isEmpty()) {
                    return res.status(422).render('admin/edit-product', {
                        path: '/admin/add-product',
                        pageTitle: 'Admin - Add Product',
                        errorMessage: errors.array()[0].msg,
                        validationErrors: errors.array(),
                        editing: true,
                        product: {
                            title: updatedTitle,
                            price: updatedPrice,
                            description: updatedDesc
                        }
                    })
                }
               Product.findById(prodId)
               .then(product => {
                   if(product.userId.toString() !== req.user._id.toString()){
                       return res.redirect("/");
                   }
                   product.title = updatedTitle;
                   product.price = updatedPrice;
                   product.description = updatedDesc;
                   product.imageUrl = image;
                   if(image){
                       fileHelper.deleteFile(product.imageUrl);
                       product.imageUrl = image.path;
                   }
                   return product.save()
                   .then(result => {
                    res.redirect("/admin/products");
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
               })
               
    };

    exports.deleteProduct = (req, res, next) => {
        const prodId = req.params.productId;
        Product.findById(prodId)
        .then(product => {
            if(!product){
                return next(new Error('Product not found.'))
            }
            fileHelper.deleteFile(product.imageUrl);
        })
        .catch()
        return Product.findByIdAndDelete({_id: prodId, userId: req.user._id})
        .then(result => {
            res.status(200).json({message: "Success!"});
        })
        .catch(err => {
            res.status(500).json({ message: "Deleting product failed." })
        });
        
    }

    exports.adminProducts = (req, res, next) => {
        const page = req.query.page;
        if(!req.session.isLoggedIn){
            return res.redirect("/login");
        }
        Product.find({ userId: req.user._id })
        // .select("title price -_id")
        // .populate("userId", "name")
        .countDocuments()
        .then(numProducts => {
        totalItems = numProducts;
        return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin - Products",
                path: "/admin/products",
                isAuthenticated: req.session.isLoggedIn,
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    };