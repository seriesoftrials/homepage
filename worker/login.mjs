const styles = `
  <script src="/serial-page-theme.js"></script>
  <link rel="stylesheet" href="/action-button.css?v=3">
  <link rel="stylesheet" href="/ver2.css?v=117">
  <link rel="stylesheet" href="/serial-shell.css?v=2">
  <link rel="stylesheet" href="/member-login.css">
`;

export function styleLoginPage(response) {
  if (response.status !== 200 || !response.headers.get("content-type")?.startsWith("text/html")) return response;

  return new HTMLRewriter()
    .on('link[href^="/styles.css"], link[href^="/fonts/instrument-serif-"]', {
      element(link) { link.remove(); },
    })
    .on('meta[name="theme-color"]', { element(meta) { meta.setAttribute("content", "#fafaf8"); } })
    .on("head", { element(head) { head.append(styles, { html: true }); } })
    .on('body[data-page="login"]', { element(body) { body.setAttribute("class", "serial-shell login-page"); } })
    .on(".member-header", { element(header) { header.setAttribute("class", "masthead"); } })
    .on(".member-header .wordmark", {
      element(link) {
        link.setAttribute("class", "brand");
        link.setInnerContent('<img src="/nav-ribbon-rest.png" alt="" width="40" height="40">', { html: true });
      },
    })
    .on(".member-back", {
      element(link) { link.setAttribute("class", "action-button action-button--quiet action-button--compact"); },
    })
    .on(".member-button", { element(button) { button.setAttribute("class", "action-button"); } })
    .transform(response);
}
