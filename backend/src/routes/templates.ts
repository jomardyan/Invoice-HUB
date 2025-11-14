import { Router } from "express";
import { body, param, query } from "express-validator";
import { authMiddleware, requireTenant } from "@/middleware/auth";
import { TemplateService, TemplateCreateInput, TemplateUpdateInput } from "@/services/TemplateService";
import logger from "@/utils/logger";

const router: Router = Router();
const templateService = new TemplateService();

router.use(authMiddleware);
router.use(requireTenant);

router.post("/:tenantId/templates", body("name").trim().notEmpty(), body("type").isIn(["invoice", "email", "sms", "reminder"]), body("body").trim().notEmpty(), async (req: any, res: any) => {
  try {
    const template = await templateService.createTemplate(req.params.tenantId, req.body as TemplateCreateInput);
    res.status(201).json({ status: "success", data: template });
  } catch (error: any) {
    logger.error("Create template error:", error);
    res.status(400).json({ status: "error", message: error.message });
  }
});

router.get("/:tenantId/templates", query("type").optional(), async (req: any, res: any) => {
  try {
    const templates = await templateService.listTemplates(req.params.tenantId, req.query.type);
    res.json({ status: "success", data: templates, count: templates.length });
  } catch (error: any) {
    logger.error("List templates error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/:tenantId/templates/:templateId", param("templateId").isUUID(), async (req: any, res: any) => {
  try {
    const template = await templateService.getTemplateById(req.params.tenantId, req.params.templateId);
    if (!template) return res.status(404).json({ status: "error", message: "Template not found" });
    res.json({ status: "success", data: template });
  } catch (error: any) {
    logger.error("Get template error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.get("/:tenantId/templates/default/:type", param("type").isIn(["invoice", "email", "sms", "reminder"]), async (req: any, res: any) => {
  try {
    const template = await templateService.getDefaultTemplate(req.params.tenantId, req.params.type);
    if (!template) return res.status(404).json({ status: "error", message: "No default template found" });
    res.json({ status: "success", data: template });
  } catch (error: any) {
    logger.error("Get default template error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.put("/:tenantId/templates/:templateId", param("templateId").isUUID(), async (req: any, res: any) => {
  try {
    const template = await templateService.updateTemplate(req.params.tenantId, req.params.templateId, req.body as TemplateUpdateInput);
    res.json({ status: "success", data: template });
  } catch (error: any) {
    logger.error("Update template error:", error);
    res.status(error.message.includes("not found") ? 404 : 400).json({ status: "error", message: error.message });
  }
});

router.delete("/:tenantId/templates/:templateId", param("templateId").isUUID(), async (req: any, res: any) => {
  try {
    await templateService.deleteTemplate(req.params.tenantId, req.params.templateId);
    res.json({ status: "success", message: "Template deleted" });
  } catch (error: any) {
    logger.error("Delete template error:", error);
    res.status(error.message.includes("not found") ? 404 : 500).json({ status: "error", message: error.message });
  }
});

router.post("/:tenantId/templates/:templateId/render", param("templateId").isUUID(), body("variables").isObject(), async (req: any, res: any) => {
  try {
    const template = await templateService.getTemplateById(req.params.tenantId, req.params.templateId);
    if (!template) return res.status(404).json({ status: "error", message: "Template not found" });
    const rendered = await templateService.renderTemplate(template, { variables: req.body.variables, fallbackValues: req.body.fallbackValues });
    res.json({ status: "success", data: rendered });
  } catch (error: any) {
    logger.error("Render template error:", error);
    res.status(400).json({ status: "error", message: error.message });
  }
});

router.post("/:tenantId/templates/:templateId/validate", param("templateId").isUUID(), async (req: any, res: any) => {
  try {
    const template = await templateService.getTemplateById(req.params.tenantId, req.params.templateId);
    if (!template) return res.status(404).json({ status: "error", message: "Template not found" });
    const validation = await templateService.validateTemplate(template);
    res.json({ status: "success", data: validation });
  } catch (error: any) {
    logger.error("Validate template error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

router.post("/:tenantId/templates/:templateId/clone", param("templateId").isUUID(), body("newName").trim().notEmpty(), async (req: any, res: any) => {
  try {
    const cloned = await templateService.cloneTemplate(req.params.tenantId, req.params.templateId, req.body.newName);
    res.status(201).json({ status: "success", data: cloned });
  } catch (error: any) {
    logger.error("Clone template error:", error);
    res.status(error.message.includes("not found") ? 404 : 400).json({ status: "error", message: error.message });
  }
});

export default router;
