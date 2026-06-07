const SESSION_TIMEOUT_MS = 10 * 60 * 1000

const getSessionCutoffDate = () => new Date(Date.now() - SESSION_TIMEOUT_MS)

const isSessionExpired = (user) => {
    if (!user?.isSessionActive) return false
    if (!user.lastSeenAt) return false

    return new Date(user.lastSeenAt).getTime() < Date.now() - SESSION_TIMEOUT_MS
}

const touchUserSession = async (user) => {
    if (!user) return null

    user.isSessionActive = true
    user.lastSeenAt = new Date()
    await user.save()
    return user
}

const markExpiredSessionsOffline = (UserModel) =>
    UserModel.updateMany(
        {
            isSessionActive: true,
            lastSeenAt: { $lt: getSessionCutoffDate() }
        },
        { $set: { isSessionActive: false } }
    )

module.exports = {
    SESSION_TIMEOUT_MS,
    getSessionCutoffDate,
    isSessionExpired,
    markExpiredSessionsOffline,
    touchUserSession
}
