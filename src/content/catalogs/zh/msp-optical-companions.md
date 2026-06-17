---
title: "球状星团中毫秒脉冲星的光学伴星"
description: "银河系球状星团中毫秒脉冲星（MSP）光学伴星星表，包含测光参数与轨道参数。"
version: "1.0"
rows: 30
dataFile: "/catalogs/msp-optical-companions-catalog.json"
columns:
  - { key: "id", label: "ID", type: "string" }
  - { key: "cluster", label: "星团", type: "string" }
  - { key: "pulsar", label: "脉冲星", type: "string" }
  - { key: "ra", label: "赤经 (J2000)", type: "ra" }
  - { key: "dec", label: "赤纬 (J2000)", type: "dec" }
  - { key: "companion_mag", label: "V 星等", type: "number" }
  - { key: "orbital_period", label: "轨道周期 (天)", type: "number" }
  - { key: "companion_type", label: "伴星类型", type: "string" }
citation: "Placeholder et al. (2025), ApJ, submitted"
doi: "10.3847/1538-4357/xxxx"
---

## 简介

本星表汇编了银河系球状星团中毫秒脉冲星（MSP）的光学伴星。毫秒脉冲星是通过双星系统中伴星的物质转移而被加速旋转的高速旋转中子星。认证和表征这些 MSP 的光学伴星，对双星演化模型、密集恒星环境中 MSP 的形成通道以及致密双星系统的物理学提供了关键约束。

观测使用 8 米级望远镜的深度光学成像和多目标光谱进行，并辅以哈勃空间望远镜对高恒星密度星团的存档数据。伴星认证依赖于与射电计时位置的位置重合、脉冲星轨道周期上的光学变化性以及光谱能量分布拟合。

## 数据获取

完整星表以 JSON 格式提供下载。下方的交互式表格允许您搜索、排序和过滤数据。

数据列说明：
- **ID**：每个源的唯一标识符
- **星团**：宿主球状星团编号
- **脉冲星**：星团内毫秒脉冲星编号
- **赤经 / 赤纬**：J2000 赤道坐标，以时分秒格式表示
- **V 星等**：光学伴星的 V 波段视星等
- **轨道周期 (天)**：双星系统的轨道周期，以天为单位
- **伴星类型**：伴星的光谱分类（如氦白矮星、CO 白矮星、主序星、极低质量伴星等）

## 引用

如果您在研究中使用本星表，请引用：

> Placeholder et al. (2025), "Optical Companions to Millisecond Pulsars in Galactic Globular Clusters", *The Astrophysical Journal*, submitted. DOI: [10.3847/1538-4357/xxxx](https://doi.org/10.3847/1538-4357/xxxx)

## 版本历史

- **v1.0** (2025-06-15)：首次发布，包含 12 个球状星团中的 30 个源。
