---
title: "银河系核球区变星星表"
description: "基于多历元光谱观测认证的银河系核球区变星星表。"
version: "1.0"
rows: 50
dataFile: "/catalogs/variable-stars-catalog.json"
columns:
  - { key: "id", label: "ID", type: "string" }
  - { key: "name", label: "名称", type: "string" }
  - { key: "ra", label: "赤经 (J2000)", type: "ra" }
  - { key: "dec", label: "赤纬 (J2000)", type: "dec" }
  - { key: "magnitude", label: "V 星等", type: "number" }
  - { key: "period", label: "周期 (天)", type: "number" }
  - { key: "type", label: "变星类型", type: "string" }
  - { key: "metallicity", label: "[Fe/H]", type: "number" }
  - { key: "distance_kpc", label: "距离 (kpc)", type: "number" }
citation: "Placeholder et al. (2024), ApJ, 965, 112"
doi: "10.3847/1538-4357/xxxx"
---

## 简介

本星表收录了通过多历元光谱观测在银河系核球区域识别的变星。巡天观测使用4米级望远镜上的高分辨率光谱仪进行，覆盖了以银河系中心为中心约10平方度的天区。观测基线超过三年，能够探测到各种时间尺度上的周期性变化。

星表包含两大类脉动变星：天琴座RR型变星（RR Lyrae），它们是径向脉动的水平分支恒星，周期通常小于一天；以及经典造父变星（Cepheid），它们是更为明亮的脉动超巨星，具有较长的周期。这两种类型都是恒星天体物理学中的关键距离指示器，是校准宇宙距离阶梯的基础。

星表中的每颗恒星都根据其光变曲线形态、周期和光谱特性进行了分类。测光数据在V波段获取，金属丰度（[Fe/H]）通过高分辨率光谱中铁线的等值宽度测量得出。距离使用适合每种变星类型的周光关系估算，并利用三维消光图进行了星际消光校正。

本星表旨在支持对银河系核球结构和恒星族群的研究，包括金属丰度分布函数、不同视线方向的距离分布，以及该区域老年和中年恒星族群的运动学特性研究。

## 数据获取

完整星表以 JSON 格式提供下载。下方的交互式表格允许您搜索、排序和过滤数据。您也可以下载完整数据集进行离线分析。

数据列说明：
- **ID**：每个源的唯一标识符
- **名称**：变星命名，遵循 IAU 命名规范
- **赤经 / 赤纬**：J2000 赤道坐标，以时分秒格式表示
- **V 星等**：平均 V 波段视星等
- **周期**：脉动周期，以天为单位
- **变星类型**：变星分类（天琴座RR型或造父变星）
- **[Fe/H]**：光谱金属丰度
- **距离 (kpc)**：日心距离，以千秒差距为单位

## 引用

如果您在研究中使用本星表，请引用：

> Placeholder et al. (2024), "Variable Stars in the Galactic Bulge from Multi-Epoch Spectroscopy", *The Astrophysical Journal*, 965, 112. DOI: [10.3847/1538-4357/xxxx](https://doi.org/10.3847/1538-4357/xxxx)

## 版本历史

- **v1.0** (2024-01-15)：首次发布，包含50个源。
