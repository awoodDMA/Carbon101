# Carbon101 Web App UI Brief - Version 1.0

This document provides a comprehensive overview of the Carbon101 web application user interface, including detailed descriptions and contextual paragraphs for each major section. The app is designed initially for a 1280 × 832 viewport using a 12‑column grid with 24 px gutters and 24 px safe margins, but all layouts are fully responsive and adapt seamlessly to varying screen sizes, including tablets and mobile devices.

## Global Style & Typography

To create a consistent visual identity, Carbon101 uses the Roboto typeface, balancing readability with modern aesthetics. Page titles (H1) are set at 24 px with a medium-heavy weight (600) to draw immediate attention, while section headings (H2) at 20 px with 600 weight establish clear content hierarchy. Body text is comfortable at 14 px (using rem units for scalability) with generous line height (1.6) for easy scanning. Carbon values utilize tabular-nums font feature for perfect numerical alignment. Consistent spacing rules apply throughout: 24px above H1, 16px above H2, and 8px above body text.

To ensure accessibility, all text and interactive elements meet or exceed WCAG AA color contrast ratios. Recommended line lengths of 45–75 characters improve readability across devices. The color palette features light gray (#F8F8F7) for primary surfaces, a warm accent orange (#FF611A) to highlight interactive elements and project numbers, and neutral grays to ensure data and text remain the stars of the interface. Subtle borders and drop shadows anchor white content cards on a pure white background, giving the app a crisp, professional appearance. Focus states use a 2px orange outline with 4px offset for clear visibility.

## Sidebar (Collapsible)

The left-hand sidebar serves as Carbon101's navigation backbone. In its expanded state (147 px wide), it displays user account controls at the top, followed by the current project's ID and name, a list of design options (A, B, C) with carbon totals displayed as "Option A (245 tCO₂e)", a compare view link, and a scrollable roster of other projects with a count indicator "(12)" next to the "All Projects" header. Each section (user, current section/project, and all projects) is divided by a thin gray line (#D1D1D1). 

Active items feature an orange dot indicator on the left edge alongside accent boxes with rounded corners (#E8E8E8). Long project names use CSS ellipsis with full name tooltips on hover. Collapsing the sidebar to 72 px distills it into an icon-only rail, maximizing canvas space while still providing quick access via tooltips on hover with a consistent 50ms delay. To ensure accessibility and smooth interactions:

- **ARIA Attributes**: Add aria-expanded="true|false" to the collapse toggle button so screen readers announce its state
- **Keyboard Support**: Ensure all sidebar items and toggle can be focused and activated via keyboard (Tab, Enter/Space)
- **Smooth Transitions**: Apply a 200ms ease-out transition to width and opacity changes during collapse/expand
- **Skip Links**: Include "Skip to main content" link for keyboard navigation

This flexible panel ensures navigation remains at the user's fingertips without overwhelming the primary workspace.

## Landing Dashboard

Upon signing in or clicking "Projects," users arrive at a high-level dashboard that combines strategic metrics and a project gallery. A row of four summary cards—Total Projects, Total Carbon, Carbon Saved, and Average Carbon per Project—provides an at-a-glance health check. Each card displays large bold numbers with units shown clearly in smaller gray text below (e.g., "tCO₂e"), simple line icons in light gray, and subtle shadow with gentle lift effect on hover. Cards are clickable to filter the project list below. Each card leverages a responsive card component with an aria-label describing its metric for screen readers and includes an info icon or tooltip explaining how the value is calculated to enhance transparency.

Below, an organized grid of project tiles displays thumbnails of each model (using WebP format with JPEG fallback and lazy loading), overlaid with:

- **Primary Option Carbon**: current embodied carbon for the selected design option (in tCO₂e) with comma-separated thousands
- **Carbon Saved**: the reduction from the original design option to the current, shown as percentage with directional arrow "↓ 23%" in green
- **Status Badge**: indicating "In Progress," "Review," or "Completed"
- **Last Updated**: shown as relative dates ("Updated 2 hours ago") for recent changes

A sort dropdown appears above the grid offering "Sort by: Last Updated | Carbon Saved | Name". Tiles remain fully responsive with CSS containment for performance, stacking into a single column on narrow viewports and providing hover tooltips for additional context. Loading states show skeleton screens in light gray (#F0F0F0) with subtle shimmer animation. A dedicated "+ New Project" tile at the end empowers users to expand their portfolio. This dual-layered approach balances executive summary with rapid entry into detailed analysis.

## Project Detail View

Drilling into a design option transforms the canvas into a focused analysis workspace. At the top, a breadcrumb-like bar features a back link with keyboard shortcut hint "← Back (ESC)" to the main dashboard using "›" separators, the active option's name in bold orange shown as a minimal dropdown, and quick actions for uploading models (with progress bar feedback) or opening new tabs. A small "Saved" checkmark appears briefly after changes.

The central split view dedicates 60% width to an interactive 3D viewer—complete with minimal floating controls in the bottom-right (white rounded buttons with thin gray borders for orbit, zoom, fullscreen, and reset view)—and 40% to a responsive doughnut chart visualizing embodied carbon by system. The chart displays the total value bold and large in the center with "tCO₂e" in smaller gray text below, uses clickable legend items styled as white pill buttons with subtle shadows, and implements smooth segment enlargement on hover. Chart colors maintain the established palette of blues, greens, and accent colors.

Clicking either the chart or model geometry highlights the counterpart using cyan/pink gradient selection, forging a seamless two-way data link. Below, a tabbed table with sticky headers toggles between Systems and Products, featuring light gray header backgrounds (#F8F8F7), thin horizontal borders only (#E8E8E8), zebra striping for readability, three-dot action menus, and an "Export CSV" button. The table lists GUIDs, quantities (formatted with commas), design percentages, and carbon metrics with sorting capabilities. Tab persistence maintains the active view when rotating devices.

## Compare View

The Compare View stands ready whenever multiple design options must be weighed side by side. A prominent heading and multi-select dropdown showing both option letters and carbon totals allow users to pick which options to juxtapose with a "Clear all" link. The main visualization, a stacked bar chart with rounded corners and segmented style, breaks embodied carbon down by system or material for each selected option. Chart styling includes very light gray dashed horizontal grid lines only, small gray axis labels with consistent decimal places and units, and visual patterns (stripes, dots) in addition to colors for accessibility.

### Filter Panel
An optional right-side filter panel offers:
- **Multi-Select Controls**: Clear "Select All" / "Unselect All" actions for systems or materials
- **Applied Filters Summary**: A concise header showing active filter criteria to maintain user context
- **Performance**: 300ms debounce on filter inputs

### Access Path
The compare page is accessed via the sidebar, directly beneath the design options.

This mode transforms raw numbers into strategic insight, illuminating tradeoffs and guiding sustainable choices.

## Responsive & Edge States

Carbon101 adapts gracefully across a broad range of devices and scenarios by defining clear breakpoints and placeholder patterns:

### Desktop (≥1200 px)
- Full sidebar (240 px) visible alongside 60/40 model–chart split
- 12‑column layout with four metric cards in a single row
- 3‑column project grid

### Tablet (768–1199 px)
- Sidebar collapses to icon-only rail (72 px) or slides in via a hamburger toggle
- Metric cards wrap into two rows of two
- Project grid reduces to two columns
- Model–chart split switches to 100% width across two stacked sections for clarity

### Mobile (<768 px)
- Sidebar becomes a top slide-in drawer with locked viewport width to prevent horizontal scrolling
- Top bar gains a menu button
- Metric cards become a horizontal swipe carousel
- Project tiles render as a single vertical list
- Model viewer and doughnut chart stack vertically with full-card width
- All touch targets maintain minimum 44×44px size
- Visible touch controls replace gesture-only interactions in the 3D viewer

## Loading & Empty States

Loading states utilize specific skeleton screens matching component shapes—rectangular for cards, circular for doughnut charts, and wireframe cube outline for 3D viewer. All skeletons use light gray (#F0F0F0) with subtle shimmer animation and no borders. 

Empty states display simple outline-style icons in light gray with descriptive text below, such as "No systems data available" or "No projects match your search. [Clear filters]" for search results. 

Error states include actionable recovery options:
- "Unable to load 3D model. [Retry] [View 2D Plan]" for failed model loads
- "Connection lost. Changes will sync when reconnected." banner for network errors

By combining these responsive rules, performance optimizations (including image lazy loading and CSS containment), and thoughtful empty state patterns, Carbon101 remains both performant and user-friendly across all devices and data states. URL structure ensures proper browser navigation with clear paths like `/projects/123/option-a`.