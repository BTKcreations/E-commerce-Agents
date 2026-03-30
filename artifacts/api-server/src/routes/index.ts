import { Router, type IRouter } from "express";
import health from "./health";
import products from "./products";
import cart from "./cart";
import orders from "./orders";
import recommendations from "./recommendations";
import pricing from "./pricing";
import qa from "./qa";
import negotiation from "./negotiation";
import support from "./support";
import openaiRoutes from "./openai-routes";
import auth from "./auth";

const router: IRouter = Router();

router.use(health);
router.use("/products", products);
router.use("/cart", cart);
router.use("/orders", orders);
router.use("/recommendations", recommendations);
router.use("/pricing", pricing);
router.use("/qa", qa);
router.use("/negotiation", negotiation);
router.use("/support", support);
router.use("/openai", openaiRoutes);
router.use("/auth", auth);


export default router;
