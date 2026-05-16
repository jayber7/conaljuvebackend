// src/utils/apiFeatures.js
class APIFeatures {
    constructor(query, queryString) {
      this.query = query; // Mongoose Query (e.g., NewsArticle.find())
      this.queryString = queryString; // Objeto query de Express (req.query)
    }
  
    filter() {
      const queryObj = { ...this.queryString };
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      excludedFields.forEach(el => delete queryObj[el]);
  
      // Filtrado avanzado (gte, gt, lte, lt) - Opcional
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
      this.query = this.query.find(JSON.parse(queryStr));
      return this;
    }
  
    sort() {
      if (this.queryString.sort) {
        // Permite ordenar por múltiples campos: sort=field1,-field2
        const sortBy = this.queryString.sort.split(',').join(' ');
        this.query = this.query.sort(sortBy);
      } else {
        // Orden por defecto (más recientes primero)
        this.query = this.query.sort('-createdAt');
      }
      return this;
    }
  
    limitFields() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(',').join(' ');
        this.query = this.query.select(fields);
      } else {
        // Excluir campo __v por defecto
        this.query = this.query.select('-__v');
      }
      return this;
    }
  
    paginate() {
      const page = parseInt(this.queryString.page, 10) || 1;
      const limit = parseInt(this.queryString.limit, 10) || 10; // Default 10 por página
      const skip = (page - 1) * limit;
  
      this.query = this.query.skip(skip).limit(limit);
      return this;
    }
  }
  module.exports = APIFeatures;