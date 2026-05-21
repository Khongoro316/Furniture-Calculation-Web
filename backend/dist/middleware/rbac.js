"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbac = void 0;
const rbac = (allowedRoles) => {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role) {
            res.status(401).json({ message: 'Нэвтрээгүй байна' });
            return;
        }
        if (!allowedRoles.includes(role)) {
            res.status(403).json({ message: 'Танд энэ үйлдлийг хийх эрх байхгүй' });
            return;
        }
        next();
    };
};
exports.rbac = rbac;
