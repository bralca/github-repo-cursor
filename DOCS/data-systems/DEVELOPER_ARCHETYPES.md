# Developer Archetype Classification System

## Overview

The Developer Archetype Classification System categorizes contributors based on their activity patterns, skills, and impact across different metrics. This classification system helps users quickly understand a developer's strengths and contribution style without needing to analyze multiple complex metrics.

## Purpose

- Provide intuitive, human-readable classifications of developer contribution patterns
- Highlight unique strengths and specializations of different contributors
- Create engagement through meaningful, shareable developer identities
- Simplify the presentation of complex metric combinations

## Core Metrics Used

The classification system uses the following metrics from the `contributor_rankings` table:

- `code_volume_score`: Measures total code contribution volume
- `code_efficiency_score`: Measures the efficiency of code changes
- `commit_impact_score`: Measures the significance of committed changes
- `repo_influence_score`: Measures influence across repositories
- `repo_popularity_score`: Measures contributions to popular repositories (based on stars/forks)
- `followers_score`: Measures community following and recognition
- `profile_completeness_score`: Measures profile information completeness
- `followers_count`: Raw count of GitHub followers
- `raw_lines_added`: Total lines of code added
- `raw_lines_removed`: Total lines of code removed
- `raw_commits_count`: Total number of commits
- `repositories_contributed`: Number of repositories contributed to

Additional metrics may be derived during the classification process.

## Developer Archetypes

### Primary Archetypes

1. **Code Architect**
   - *Description*: Consistently delivers large volumes of high-quality, efficient code
   - *Signature Strengths*: Code volume and efficiency
   - *Common Traits*: Substantial contributions to the codebase with good quality metrics

2. **System Innovator**
   - *Description*: Creates influential changes that shape project architecture across repositories
   - *Signature Strengths*: Commit impact and repository influence
   - *Common Traits*: Changes that affect core architecture and multiple projects

3. **Technical Influencer**
   - *Description*: Respected developer with strong community presence and established expertise
   - *Signature Strengths*: Followers and profile completeness
   - *Common Traits*: Strong social following and detailed profile information

4. **Precision Engineer**
   - *Description*: Focused on delivering impactful changes with minimal code footprint
   - *Signature Strengths*: Efficiency and commit impact
   - *Common Traits*: High-value changes with minimal code churn

5. **Framework Builder**
   - *Description*: Contributes foundational code that spans multiple projects
   - *Signature Strengths*: Code volume and repository influence
   - *Common Traits*: Extensive code contributions across different repositories

6. **Technical Polymath**
   - *Description*: Excels across every dimension of development, demonstrating mastery of both code quality and community impact
   - *Signature Strengths*: Balanced across all metrics
   - *Common Traits*: No weak areas, consistently good performance across all dimensions

7. **Open Source Leader**
   - *Description*: Shapes multiple projects with a strong developer following
   - *Signature Strengths*: Repository influence and followers
   - *Common Traits*: Contributions to multiple popular repositories with a significant following

8. **Efficiency Specialist**
   - *Description*: Masters the art of maximum impact with minimal code changes
   - *Signature Strengths*: Exceptional code efficiency
   - *Common Traits*: Remarkably high ratio of impact to code volume

9. **Impact Multiplier**
   - *Description*: Every commit drives significant project advancement
   - *Signature Strengths*: Exceptional commit impact
   - *Common Traits*: Commits that trigger substantial project progress

### Specialized Archetypes

10. **Project Backbone**
    - *Description*: Foundational contributor who maintains the core of a significant project
    - *Signature Strengths*: Dominance in a single repository
    - *Common Traits*: High percentage of commits in a specific project

11. **Refactoring Maestro**
    - *Description*: Expert at improving code quality through strategic removal and optimization
    - *Signature Strengths*: Efficiency with high removal/addition ratio
    - *Common Traits*: More code removed than added while maintaining functionality

12. **Rapid Prototyper**
    - *Description*: Quickly builds functional code across diverse projects
    - *Signature Strengths*: High volume with frequent commits across repositories
    - *Common Traits*: Fast iteration and high commit frequency

13. **Cross-Domain Expert**
    - *Description*: Demonstrates versatility across multiple programming paradigms and ecosystems
    - *Signature Strengths*: Contributions to diverse technological domains
    - *Common Traits*: Significant contributions to repositories with different primary languages

### Repository Popularity Archetypes

14. **Major Project Contributor**
    - *Description*: Regularly contributes to highly popular, widely-used repositories
    - *Signature Strengths*: Very high repository popularity score
    - *Common Traits*: Contributions to repositories with 1000+ stars

15. **Trending Project Developer**
    - *Description*: Focuses on active, rapidly growing repositories
    - *Signature Strengths*: High repository popularity with recent growth rate
    - *Common Traits*: Contributions to repositories with high star growth

16. **Open Source Celebrity**
    - *Description*: Works on the most recognized and starred projects in the ecosystem
    - *Signature Strengths*: Exceptional repository popularity combined with strong personal following
    - *Common Traits*: Contributions to top-tier projects (10,000+ stars) and strong personal brand

## Calculation Methodology

### General Approach

1. Calculate percentile rankings for each developer on each core metric
2. Apply archetype classification rules in order of specificity
3. Assign the first matching archetype to each developer
4. Use additional checks to ensure the classification is meaningful

### Specific Calculation Rules

1. **Code Architect**
   - Primary check: (code_volume_score > 75th percentile) AND (code_efficiency_score > 70th percentile)
   - Secondary check: raw_lines_added + raw_lines_removed > 50,000

2. **System Innovator**
   - Primary check: (commit_impact_score > 75th percentile) AND (repo_influence_score > 70th percentile)
   - Secondary check: repositories_contributed >= 3

3. **Technical Influencer**
   - Primary check: (followers_score > 80th percentile) AND (profile_completeness_score > 70th percentile)
   - Secondary check: followers_count > 100

4. **Precision Engineer**
   - Primary check: (code_efficiency_score > 85th percentile) AND (commit_impact_score > 65th percentile)
   - Secondary check: raw_commits_count > 50

5. **Framework Builder**
   - Primary check: (code_volume_score > 75th percentile) AND (repo_influence_score > 75th percentile)
   - Secondary check: repositories_contributed >= 2 AND raw_lines_added > 25,000

6. **Technical Polymath**
   - Primary check: All six core metrics > 60th percentile, with no single metric > 85th percentile
   - Secondary check: Standard deviation across normalized metrics < 15

7. **Open Source Leader**
   - Primary check: (repo_influence_score > 80th percentile) AND (followers_score > 70th percentile)
   - Secondary check: repositories_contributed >= 4

8. **Efficiency Specialist**
   - Primary check: code_efficiency_score > 90th percentile
   - Secondary check: raw_commits_count > 30

9. **Impact Multiplier**
   - Primary check: commit_impact_score > 90th percentile
   - Secondary check: raw_commits_count > 20

10. **Project Backbone**
    - Primary check: Single repository with (commit_count > 80th percentile) of all commits to that repo
    - Secondary check: raw_commits_count > 50 for that repository

11. **Refactoring Maestro**
    - Primary check: (code_efficiency_score > 70th percentile) AND (raw_lines_removed > raw_lines_added * 1.5)
    - Secondary check: raw_lines_removed > 5,000

12. **Rapid Prototyper**
    - Primary check: (code_volume_score > 75th percentile) AND (raw_commits_count / repositories_contributed > 80th percentile)
    - Secondary check: repositories_contributed >= 2

13. **Cross-Domain Expert**
    - Primary check: Contributions to repositories with 3+ different primary languages
    - Secondary check: Significant contributions in each language (> 1,000 lines)

14. **Major Project Contributor**
    - Primary check: repo_popularity_score > 85th percentile
    - Secondary check: At least one repository contributed to has 1000+ stars

15. **Trending Project Developer**
    - Primary check: repo_popularity_score > 75th percentile AND recent contributions to high-growth repos
    - Secondary check: Contributed to at least 2 repositories with 25%+ star growth in last 6 months

16. **Open Source Celebrity**
    - Primary check: repo_popularity_score > 90th percentile AND followers_score > 80th percentile
    - Secondary check: Contributed to at least one repository with 10,000+ stars

### Default Classification

If a developer doesn't match any of the above criteria, they are classified as:

**Active Contributor**
- *Description*: Regular contributor with a developing specialization pattern
- *Traits*: Consistent activity without a strongly defined specialization yet

## Implementation Guidelines

### SQL Implementation

```sql
-- Example SQL implementation for calculating archetypes
WITH percentiles AS (
  -- Calculate percentile ranks for each metric
  SELECT
    contributor_id,
    PERCENT_RANK() OVER(ORDER BY code_volume_score) AS code_volume_percentile,
    PERCENT_RANK() OVER(ORDER BY code_efficiency_score) AS code_efficiency_percentile,
    PERCENT_RANK() OVER(ORDER BY commit_impact_score) AS commit_impact_percentile,
    PERCENT_RANK() OVER(ORDER BY repo_influence_score) AS repo_influence_percentile,
    PERCENT_RANK() OVER(ORDER BY repo_popularity_score) AS repo_popularity_percentile,
    PERCENT_RANK() OVER(ORDER BY followers_score) AS followers_percentile,
    PERCENT_RANK() OVER(ORDER BY profile_completeness_score) AS profile_completeness_percentile,
    raw_lines_added,
    raw_lines_removed,
    raw_commits_count,
    repositories_contributed,
    followers_count
  FROM contributor_rankings
  WHERE calculation_timestamp = (SELECT MAX(calculation_timestamp) FROM contributor_rankings)
),
classified AS (
  SELECT
    contributor_id,
    CASE
      -- Code Architect
      WHEN code_volume_percentile > 0.75 AND code_efficiency_percentile > 0.7 
           AND (raw_lines_added + raw_lines_removed) > 50000
      THEN 'Code Architect'
      
      -- System Innovator
      WHEN commit_impact_percentile > 0.75 AND repo_influence_percentile > 0.7
           AND repositories_contributed >= 3
      THEN 'System Innovator'
      
      -- Technical Influencer
      WHEN followers_percentile > 0.8 AND profile_completeness_percentile > 0.7
           AND followers_count > 100
      THEN 'Technical Influencer'
      
      -- Precision Engineer
      WHEN code_efficiency_percentile > 0.85 AND commit_impact_percentile > 0.65
           AND raw_commits_count > 50
      THEN 'Precision Engineer'
      
      -- Framework Builder
      WHEN code_volume_percentile > 0.75 AND repo_influence_percentile > 0.75
           AND repositories_contributed >= 2 AND raw_lines_added > 25000
      THEN 'Framework Builder'
      
      -- Technical Polymath
      WHEN code_volume_percentile > 0.6 AND code_efficiency_percentile > 0.6
           AND commit_impact_percentile > 0.6 AND repo_influence_percentile > 0.6
           AND followers_percentile > 0.6 AND profile_completeness_percentile > 0.6
           AND code_volume_percentile < 0.85 AND code_efficiency_percentile < 0.85
           AND commit_impact_percentile < 0.85 AND repo_influence_percentile < 0.85
           AND followers_percentile < 0.85 AND profile_completeness_percentile < 0.85
      THEN 'Technical Polymath'
      
      -- Open Source Leader
      WHEN repo_influence_percentile > 0.8 AND followers_percentile > 0.7
           AND repositories_contributed >= 4
      THEN 'Open Source Leader'
      
      -- Efficiency Specialist
      WHEN code_efficiency_percentile > 0.9 AND raw_commits_count > 30
      THEN 'Efficiency Specialist'
      
      -- Impact Multiplier
      WHEN commit_impact_percentile > 0.9 AND raw_commits_count > 20
      THEN 'Impact Multiplier'
      
      -- Additional archetypes would be added here
      
      -- Additional repository popularity archetypes
      WHEN repo_popularity_percentile > 0.85 
           AND EXISTS (SELECT 1 FROM contributor_repository cr 
                       JOIN repositories r ON cr.repository_id = r.id
                       WHERE cr.contributor_id = p.contributor_id AND r.stars >= 1000)
      THEN 'Major Project Contributor'

      WHEN repo_popularity_percentile > 0.9 AND followers_percentile > 0.8
           AND EXISTS (SELECT 1 FROM contributor_repository cr 
                       JOIN repositories r ON cr.repository_id = r.id
                       WHERE cr.contributor_id = p.contributor_id AND r.stars >= 10000)
      THEN 'Open Source Celebrity'
      
      -- Default classification
      ELSE 'Active Contributor'
    END AS archetype
  FROM percentiles
)
SELECT * FROM classified;
```

### JavaScript Implementation

The classification can be implemented in JavaScript as follows:

```javascript
function classifyDeveloper(developer, allDevelopers) {
  // Calculate percentiles
  const percentiles = calculatePercentiles(developer, allDevelopers);
  
  // Code Architect
  if (percentiles.codeVolume > 0.75 && percentiles.codeEfficiency > 0.7 && 
      (developer.raw_lines_added + developer.raw_lines_removed) > 50000) {
    return "Code Architect";
  }
  
  // System Innovator
  if (percentiles.commitImpact > 0.75 && percentiles.repoInfluence > 0.7 &&
      developer.repositories_contributed >= 3) {
    return "System Innovator";
  }
  
  // Technical Influencer
  if (percentiles.followers > 0.8 && percentiles.profileCompleteness > 0.7 &&
      developer.followers_count > 100) {
    return "Technical Influencer";
  }
  
  // ... additional classifications
  
  // Default
  return "Active Contributor";
}

function calculatePercentiles(developer, allDevelopers) {
  // Implementation of percentile calculations
  // ...
}
```

## UI Presentation Guidelines

### Display Recommendations

- Use a consistent icon or badge for each archetype
- Display the archetype name prominently in the developer card/row
- Consider using a tooltip to show the full archetype description
- Use consistent colors that align with the archetype's "personality"

### Leaderboard Integration

In the developer leaderboard, the archetype should be displayed as a column that helps users quickly understand the developer's strengths. The implementation should:

1. Be visually distinct without overwhelming the UI
2. Use consistent iconography for each archetype
3. Provide brief descriptions on hover/interaction
4. Allow filtering the leaderboard by archetype

### Profile Integration

On developer profile pages, the archetype should be featured prominently as part of the developer's identity, with:

1. A detailed explanation of what the archetype represents
2. A breakdown of the metrics that led to this classification
3. Suggestions for areas of potential growth or focus

## Maintenance and Updates

The archetype system should be evaluated regularly:

1. Percentile thresholds may need adjustment based on data distribution
2. New archetypes can be added as patterns emerge
3. Calculations should be reviewed for accuracy and relevance

## Edge Cases and Considerations

1. **New Contributors**: Developers with limited history may not have enough data for meaningful classification
2. **Percentile Shift**: As the population changes, percentile-based thresholds will naturally adjust
3. **Gaming the System**: Monitor for attempts to artificially inflate metrics to achieve certain archetypes
4. **Default Fallback**: Ensure the default "Active Contributor" is still meaningful and not perceived as negative

## Future Enhancements

1. Time-based evolution of developer archetypes
2. Project-specific archetypes that consider domain expertise
3. Machine learning approach to discover natural clusters in the data
4. Team composition analysis based on archetype diversity 

## File-Based Metrics and Archetypes

The classification system can be enhanced with detailed file operation analysis to provide more nuanced developer categorization. This section outlines additional metrics and archetypes based on file-level contribution patterns.

### Additional File-Based Metrics

1. **File Operation Distribution**
   - *Description*: Breakdown of operations by file status (added, modified, deleted)
   - *Calculation*: Count of files by operation type per contributor
   - *SQL Implementation*:
     ```sql
     SELECT
       contributor_id,
       COUNT(CASE WHEN status = 'added' THEN 1 END) AS files_added,
       COUNT(CASE WHEN status = 'modified' THEN 1 END) AS files_modified,
       COUNT(CASE WHEN status = 'deleted' THEN 1 END) AS files_deleted,
       COUNT(*) AS total_file_operations
     FROM commits
     GROUP BY contributor_id
     ```

2. **Files per Commit Ratio**
   - *Description*: Average number of files changed in each commit
   - *Calculation*: Mean of file count per unique commit SHA
   - *SQL Implementation*:
     ```sql
     WITH commit_files AS (
       SELECT 
         contributor_id,
         github_id,
         COUNT(*) AS file_count
       FROM commits
       GROUP BY contributor_id, github_id
     )
     SELECT
       contributor_id,
       AVG(file_count) AS avg_files_per_commit,
       MAX(file_count) AS max_files_per_commit
     FROM commit_files
     GROUP BY contributor_id
     ```

3. **File Type Diversity**
   - *Description*: Variety of file types/extensions worked with
   - *Calculation*: Count of distinct file extensions and distribution
   - *SQL Implementation*:
     ```sql
     SELECT
       contributor_id,
       COUNT(DISTINCT SUBSTR(filename, INSTR(filename, '.', -1) + 1)) AS distinct_extensions,
       GROUP_CONCAT(DISTINCT SUBSTR(filename, INSTR(filename, '.', -1) + 1)) AS extension_list
     FROM commits
     WHERE INSTR(filename, '.') > 0
     GROUP BY contributor_id
     ```

### Additional File-Based Archetypes

1. **Codebase Renovator**
   - *Description*: Specializes in updating and refactoring existing files across the codebase
   - *Signature Strengths*: High ratio of modified files to added/deleted files
   - *Common Traits*: Focus on improving existing code rather than adding new functionality
   - *Primary Check*: (files_modified > (files_added + files_deleted) * 2) AND (avg_files_per_commit BETWEEN 3 AND 7)
   - *Secondary Check*: files_modified > 100

2. **Solution Architect**
   - *Description*: Creates comprehensive solutions touching multiple files in coordinated changes
   - *Signature Strengths*: High files-per-commit ratio with balanced operation types
   - *Common Traits*: Implements features that require changes across the codebase
   - *Primary Check*: avg_files_per_commit > 8 AND raw_commits_count > 15
   - *Secondary Check*: files_added > total_file_operations * 0.25

3. **File Structure Specialist**
   - *Description*: Expert at organizing and restructuring codebases
   - *Signature Strengths*: High ratio of added + deleted operations (file moves appear as add+delete)
   - *Common Traits*: Frequently relocates code and reorganizes project structure
   - *Primary Check*: (files_added + files_deleted) > files_modified * 1.5
   - *Secondary Check*: files_added > 50 AND files_deleted > 50

4. **Full-Stack Integrator**
   - *Description*: Works across diverse file types, connecting different layers of the application
   - *Signature Strengths*: High diversity in file extensions touched
   - *Common Traits*: Comfortable working with multiple technologies and application layers
   - *Primary Check*: distinct_extensions > 5
   - *Secondary Check*: No single extension represents more than 40% of contributions

5. **Surgical Committer**
   - *Description*: Makes precise, targeted changes to single files
   - *Signature Strengths*: Low files-per-commit ratio combined with high commit count
   - *Common Traits*: Focused problem-solving approach with minimal side effects
   - *Primary Check*: avg_files_per_commit < 2 AND raw_commits_count > 50
   - *Secondary Check*: commit_impact_score > 60th percentile

### Implementation Considerations

To incorporate these file-based metrics and archetypes:

1. Add the necessary columns to the `contributor_rankings` table
2. Update the ranking calculation queries to include file-based metrics
3. Expand the archetype classification logic to include these new categories
4. Create appropriate visual indicators for the new archetypes
5. Consider appropriate percentile thresholds based on project norms

## Future Enhancements 