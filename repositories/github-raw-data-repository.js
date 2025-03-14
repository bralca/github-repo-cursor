const { rawData } = require('../db-client');

/**
 * Repository class for handling GitHub raw data operations
 */
class GithubRawDataRepository {
  /**
   * Find a raw data record by entity type and GitHub ID
   * 
   * @param {string} entityType - Type of entity (repository, contributor, etc.)
   * @param {string} githubId - GitHub entity ID
   * @returns {Promise<Object|null>} The raw data record or null if not found
   */
  async findByEntityAndId(entityType, githubId) {
    const query = `
      SELECT * FROM github_raw_data
      WHERE entity_type = $1 AND github_id = $2
    `;
    
    const result = await rawData.query(query, [entityType, String(githubId)]);
    return result.rows[0] || null;
  }
  
  /**
   * Save (insert or update) a raw data record
   * 
   * @param {Object} rawDataObject - The raw data object to save
   * @returns {Promise<Object>} The saved record
   */
  async save(rawDataObject) {
    const query = `
      INSERT INTO github_raw_data 
        (entity_type, github_id, data, fetched_at, api_endpoint, etag)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (entity_type, github_id) 
      DO UPDATE SET 
        data = EXCLUDED.data,
        fetched_at = EXCLUDED.fetched_at,
        api_endpoint = EXCLUDED.api_endpoint,
        etag = EXCLUDED.etag
      RETURNING *
    `;
    
    const values = [
      rawDataObject.entity_type,
      String(rawDataObject.github_id), // Ensure github_id is stored as text
      rawDataObject.data,
      rawDataObject.fetched_at || new Date(),
      rawDataObject.api_endpoint,
      rawDataObject.etag
    ];
    
    const result = await rawData.query(query, values);
    return result.rows[0];
  }
  
  /**
   * Find raw data records by entity type with pagination
   * 
   * @param {string} entityType - Type of entity (repository, contributor, etc.)
   * @param {number} limit - Maximum number of records to return
   * @param {number} offset - Number of records to skip
   * @returns {Promise<Array>} Array of raw data records
   */
  async findByEntityType(entityType, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM github_raw_data
      WHERE entity_type = $1
      ORDER BY fetched_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await rawData.query(query, [entityType, limit, offset]);
    return result.rows;
  }
  
  /**
   * Find recently fetched raw data records
   * 
   * @param {number} hours - Number of hours to look back
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of recently fetched raw data records
   */
  async findRecentlyFetched(hours = 24, limit = 100) {
    const query = `
      SELECT * FROM github_raw_data
      WHERE fetched_at > NOW() - INTERVAL '${hours} hours'
      ORDER BY fetched_at DESC
      LIMIT $1
    `;
    
    const result = await rawData.query(query, [limit]);
    return result.rows;
  }
  
  /**
   * Delete a raw data record by entity type and GitHub ID
   * 
   * @param {string} entityType - Type of entity (repository, contributor, etc.)
   * @param {string} githubId - GitHub entity ID
   * @returns {Promise<boolean>} True if record was deleted, false otherwise
   */
  async deleteByEntityAndId(entityType, githubId) {
    const query = `
      DELETE FROM github_raw_data
      WHERE entity_type = $1 AND github_id = $2
      RETURNING id
    `;
    
    const result = await rawData.query(query, [entityType, String(githubId)]);
    return result.rowCount > 0;
  }
  
  /**
   * Get counts of raw data records by entity type
   * 
   * @returns {Promise<Object>} Object with entity types as keys and counts as values
   */
  async getEntityCounts() {
    const query = `
      SELECT entity_type, COUNT(*) as count
      FROM github_raw_data
      GROUP BY entity_type
      ORDER BY count DESC
    `;
    
    const result = await rawData.query(query);
    const counts = {};
    
    result.rows.forEach(row => {
      counts[row.entity_type] = parseInt(row.count);
    });
    
    return counts;
  }
  
  /**
   * Get the oldest and newest fetch timestamps
   * 
   * @returns {Promise<Object>} Object with oldest and newest timestamps
   */
  async getDataAgeStats() {
    const query = `
      SELECT 
        MIN(fetched_at) as oldest,
        MAX(fetched_at) as newest
      FROM github_raw_data
    `;
    
    const result = await rawData.query(query);
    return result.rows[0] || { oldest: null, newest: null };
  }
}

// Export a singleton instance
module.exports = new GithubRawDataRepository(); 