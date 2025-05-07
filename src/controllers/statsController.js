// src/controllers/statsController.js
const Member = require('../models/Member');
const NewsArticle = require('../models/NewsArticle');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

const getSummaryStats = asyncHandler(async (req, res, next) => {
    const [
        totalMemberCount,       // <-- Nuevo: Todos los miembros registrados
        verifiedMemberCount,    // <-- Existente (o nuevo si antes contabas todos)
        newsCount,
        projectCount
    ] = await Promise.all([
        Member.countDocuments(), // <-- Contar TODOS los documentos en la colección Member
        Member.countDocuments({ status: 'VERIFIED' }), // <-- Contar solo los VERIFIED
        NewsArticle.countDocuments({ isPublished: true }),
        Project.countDocuments({ status: { $in: ['PLANIFICADO', 'EN_EJECUCION', 'COMPLETADO'] } })
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            totalMemberCount,     // <-- Devolver nuevo conteo
            verifiedMemberCount,  // <-- Devolver conteo verificado
            newsCount,
            projectCount,
        }
    });
});
module.exports = { getSummaryStats };



