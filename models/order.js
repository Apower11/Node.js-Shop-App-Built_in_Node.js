const mongoose = require("mongoose");
const Product = require("./product");
const User = require("./user");
const Schema = mongoose.Schema;

const orderSchema = new Schema ({
    products: [
        {
            product: { type: Object, ref: 'Product', required: true},
            quantity: {type: Number, required: true}
        }
    ],
    user: {
        email: {
            type: String,
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        }
    }
})

// orderSchema.methods.addOrder = function() {
//     const cartItems = User.cart.items;
//     console.log(User.cart.items)
//     this.products = cartItems;
//     return this.save()
//     .then(result => {
//         User.cart= {items: []};
//     })
// }

orderSchema.methods.getOrders = function() {
    orderSchema.find({ 'user._id': this._id}).toArray()
}
    //     getOrders() {
    //         const db = getDb();
    //         return db
    //         .collection('orders')
    //         .find({ 'user._id': new mongodb.ObjectId(this._id) })
    //         .toArray()
    //     }

module.exports = mongoose.model('Order', orderSchema);
