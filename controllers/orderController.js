const expressAsyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");
const Notification = require("../models/notificationModel");
const VendorNotification = require("../models/vendorNotificationModel");

const createOrder = expressAsyncHandler(async (req, res) => {

  const { items, user, shippingAddress, totalPrice, status, paymentInfo } = req.body;

  try {
    const vendorOrdersMap = new Map();

    // Group items by vendorId
    for (const item of items) {
      const vendorId = item.vendorId;
      if (!vendorOrdersMap.has(vendorId)) {
        vendorOrdersMap.set(vendorId, []);
      }
      vendorOrdersMap.get(vendorId).push(item);
    }

    const orders = [];

    // Loop through each vendor and create separate orders + notifications
    for (const [vendorId, vendorItems] of vendorOrdersMap) {
      const vendorTotalPrice = vendorItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      const newOrder = new Order({
        items: vendorItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        user,
        vendorId,
        shippingAddress,
        totalPrice: vendorTotalPrice,
        status,
        paymentInfo,
      });

      const savedOrder = await newOrder.save();
      orders.push(savedOrder);

      //Create a notification for the vendor
      await VendorNotification.create({
        vendor: vendorId,
        type: "new_order",
        message: `📦 You received a new order with ${vendorItems.length} item(s)!`,
      });
    }

    //Create a single admin notification
    await Notification.create({
      type: "new_order",
      message: `📦 New order placed with ${items.length} item(s)!`,
    });

    res.status(201).json({
      success: true,
      orders,
      message: "Orders created successfully",
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get orders for a specific vendor
const getVendorOrders = expressAsyncHandler(async (req, res) => {
  try {
      const { vendorId } = req.params;
      const orders = await Order.find({ vendorId }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, orders });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Get a single order
const getSingleOrder = expressAsyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (order) {
      res.status(200).json({
        success: true,
        order,
      });
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single order for user
 const getMyOrderById = expressAsyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({ _id: orderId, user: req.user._id }).lean();
  if (!order) return res.status(404).json({ message: "Order not found" });

  res.status(200).json({ success: true, order });
});

// Update order status (vendor can only update their own orders)
const updateOrderStatus = expressAsyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, vendorId } = req.body;  
    
    if (!vendorId) {
      return res.status(403).json({ message: "Unauthorized: Vendor information is missing" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the vendor is authorized to update the order
    if (order.vendorId.toString() !== vendorId.toString()) {
      return res.status(403).json({ message: "You are not authorized to update this order" });
    }

    // Update the order status
    order.status = status;
    await order.save();

    const statusFormatted = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  
    res.status(200).json({
      message: `Order status updated to "${statusFormatted}"`,
      order,
    });
    } catch (error) {
    console.error("Error occurred while updating order status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// delete order by vendor (vendor can only update their own orders)
const deleteOrder = expressAsyncHandler(async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.orderId, vendorId: req.body.vendorId });
    if (!order) return res.status(404).json({ message: "Order not found." });

    res.json({ message: "Order deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
});

// Get orders for a specific user
const getUserOrders = expressAsyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found for this user." });
    }

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: error.message });
  }
});

// Refund an order
const refundOrder = expressAsyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    console.error("Order ID and Status:", orderId, status );

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "refunded") {
      return res.status(400).json({ message: "Order has already been refunded" });
    }

    order.status = status;
    await order.save();

    //Create a refund request notification for admin
    await Notification.create({
      type: "refund_request",
      message: `💸 Refund requested for Order #${order._id}`,
    });
    
    res.status(200).json({
      success: true,
      message: "Order refund requested successfully",
      order,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get refunded orders for a specific vendor
const getVendorRefundedOrders = expressAsyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const refundedOrders = await Order.find({
      vendorId,
      status: { $in: [ "refund_approved", "refund_rejected"] },
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders: refundedOrders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch refunded orders", error: error.message });
  }
});


module.exports = {
  createOrder,
  getVendorOrders,
  getSingleOrder,
  getMyOrderById,
  updateOrderStatus,
  deleteOrder,
  getUserOrders,
  refundOrder,
  getVendorRefundedOrders
};



