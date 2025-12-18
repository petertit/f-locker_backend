// server/src/app/controllers/SiteController.js
class SiteController {
  home(req, res) {
    // Nếu bạn có dùng handlebars views thì render:
    // return res.render("home");
    return res.json({ ok: true, message: "F-LOCK backend is running ✅" });
  }
}

export default new SiteController();
