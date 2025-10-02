---
sidebar_position: 10
label: "Wildcards"
title: "Wildcards"
---

# Wildcards

Wildcards are special characters that can stand in for unknown characters in a text value and are handy for
locating multiple items with similar, but not identical data. Wildcards can also help with getting data based on
a specified pattern match. For example, finding everyone named John on Park Street.

Tombolo can use wildcards to find assets that match a specific pattern. They are especially useful if you do not
know the complete asset name but you know the pattern, or if you want to include all the assets that are of a
specific pattern, or assets that are not currently in the cluster but could arrive in the future.

## Where wildcards are used

Wildcards are referenced or available in the following user guides:

- Landing Zone Monitoring: File name pattern matching supports wildcards for matching files (for example, `data_*.csv`, `report_??_*.txt`). See User-Guides/monitoring/LandingZoneMonitoring.md.
- Job Monitoring: Job name patterns can be specified to monitor jobs whose names vary predictably (for example, prefixes/suffixes with dates). See User-Guides/monitoring/jobMonitoring.md.

If you discover additional locations where wildcard patterns are supported, please update this list.

## Asterisk

Matches any number of characters. You can use the asterisk **(\*)** anywhere in a character string.

Examples

<ul>
    <li>
        **wh***- finds what, white and why, but not awhile or watch.
    </li>
    <li>
        **\*wh\*** - finds what, white, why and awhile, but not watch.
    </li>
</ul>

## Question Mark (?)

Matches a single character in a specific position.

Examples

<ul>
    <li>
        **b?ll** - finds ball, bell, and bill, but not bal.
    </li>
    <li>
        **Big??Query** - finds Big19Query, Big98Query, BigABQuery, but not Big1Query.
    </li>
</ul>
