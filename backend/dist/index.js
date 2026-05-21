"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const material_routes_1 = __importDefault(require("./modules/material/material.routes"));
const service_routes_1 = __importDefault(require("./modules/service/service.routes"));
const furniture_routes_1 = __importDefault(require("./modules/furniture/furniture.routes"));
const calculation_routes_1 = __importDefault(require("./modules/calculation/calculation.routes"));
const order_routes_1 = __importDefault(require("./modules/order/order.routes"));
const report_routes_1 = __importDefault(require("./modules/report/report.routes"));
const organization_routes_1 = __importDefault(require("./modules/organization/organization.routes"));
const auditLog_1 = require("./middleware/auditLog");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(auditLog_1.auditLog);
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/materials', material_routes_1.default);
app.use('/api/services', service_routes_1.default);
app.use('/api/furniture-types', furniture_routes_1.default);
app.use('/api/calculations', calculation_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.use('/api/organizations', organization_routes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'Тавилгын тооцооны систем API ажиллаж байна' });
});
app.listen(PORT, () => {
    console.log(`Server ${PORT} порт дээр ажиллаж байна`);
});
