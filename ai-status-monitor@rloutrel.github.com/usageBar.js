// Usage bar painting. GJS-only: draws the progress bar on a St.DrawingArea
// using Cairo, with colors taken from the theme node so style classes
// (.success/.warning/.error) drive the bar color.
export function drawUsageBar(area, fraction) {
    const allocation = area.get_allocation_box();
    const width = allocation.x2 - allocation.x1;
    const height = allocation.y2 - allocation.y1;
    if (width <= 0 || height <= 0)
        return;
    const themeNode = area.get_theme_node();
    const fg = themeNode.get_foreground_color();
    const cr = area.get_context();
    cr.save();
    cr.setSourceRGBA(fg.red, fg.green, fg.blue, 0.25);
    cr.rectangle(0, 0, width, height);
    cr.paint();
    const filled = Math.max(0, Math.min(1, fraction)) * width;
    cr.setSourceRGBA(fg.red, fg.green, fg.blue, fg.alpha);
    cr.rectangle(0, 0, filled, height);
    cr.fill();
    cr.restore();
}
