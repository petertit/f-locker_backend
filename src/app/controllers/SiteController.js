class SiteController {
  home(req, res) {
    return res.json({ ok: true, message: "F-LOCK backend is running ✅" });
  }
}

export default new SiteController();
