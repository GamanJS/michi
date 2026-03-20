# 🛣️ Michi (道)
**Michi** (Japanese for Path) is a high-performance Radix Tree Router designed as the core routing engine for **GamanJS**. Built with a focus on extreme speed, minimal memory allocation, and native support for Universal Transport Layers (HTTP, IPC, WebSockets).

Unlike standard Regex-based routers that perform linear searches $O(n)$, Michi utilizes a **Radix Tree** structure $O(k)$, ensuring lookup speeds remain constant regardless of how many routes you define.

## Installation
```bash
bun install @gaman/michi
```