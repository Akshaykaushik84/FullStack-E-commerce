const STATUS_FLOW = ["Pending", "Approved", "Shipped", "Delivered"]
const STATUS_THRESHOLDS = {
    approved: 2 * 60 * 1000,
    shipped: 24 * 60 * 60 * 1000,
    delivered: 48 * 60 * 60 * 1000
}

const getTimedOrderStatus = (createdAt) => {
    const orderTime = new Date(createdAt).getTime()
    const elapsed = Date.now() - orderTime

    if (elapsed >= STATUS_THRESHOLDS.delivered) {
        return "Delivered"
    }

    if (elapsed >= STATUS_THRESHOLDS.shipped) {
        return "Shipped"
    }

    if (elapsed >= STATUS_THRESHOLDS.approved) {
        return "Approved"
    }

    return "Pending"
}

const shouldAutoProgress = (status) => status !== "Cancelled"

const syncOrderStatus = async (order) => {
    if (!order || !shouldAutoProgress(order.status)) {
        return order
    }

    const nextStatus = getTimedOrderStatus(order.createdAt)

    if (order.status !== nextStatus) {
        order.status = nextStatus
        await order.save()
    }

    return order
}

const syncOrderStatuses = async (orders = []) => {
    await Promise.all(orders.map((order) => syncOrderStatus(order)))
    return orders
}

module.exports = {
    STATUS_FLOW,
    getTimedOrderStatus,
    syncOrderStatus,
    syncOrderStatuses
}
