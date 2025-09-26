const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const {
  submitReport,
  getAllReports,
  addComment
} = require('../models/workReportModel')
const db = require('../config/db');


const submitWorkReport = async (req, res) => {
  const { userId } = req.user;
  let { content, frequency } = req.body;

  if (!content || !frequency) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    frequency = frequency.toLowerCase()
    const report = await submitReport({
      userId ,
      content,
      frequency,
      submitted_by: userId,
      status:  'Pending',
    });

    res.status(201).json(report);
  } catch (err) {
    console.error('Submit Error:', err);
    res.status(500).json({ message: 'Submit error', error: err.message });
  }
};

 

const viewReports = async (req, res) => {
  try {
    const { userId, role } = req.user;

    let reports;

    if (role === 'admin') {
      reports = await getAllReports(); 
    } else if (role === 'hr') {
      const ownReports = await getAllReports(userId); 
      const allEmployeeReports = await db.query(
        `SELECT wr.* FROM work_reports wr
         JOIN users u ON wr.user_id = u.user_id
         WHERE u.role = 'employee'`
      ).then(result => result.rows); 
      
      reports = [...new Map(
        [...ownReports, ...allEmployeeReports].map(r => [r.report_id, r])
      ).values()];
    } else if (role === 'employee') {
      reports = await getAllReports(userId);
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.status(200).json(reports);
  } catch (err) {
        console.error("ViewReports Error:", err);
    res.status(500).json({ message: 'Fetch error', error: err.message });
  }
};



const commentOnReport = async (req, res) => {
  const reviewed_by = req.user.userId;
  const { role } = req.user;
  const report_id = req.params.report_id;
  const { comment, status } = req.body;

  if (!comment || !report_id) {
    return res.status(400).json({ message: 'Missing report ID or comment' });
  }

  try {
    const reportResult = await db.query(
      `SELECT user_id FROM work_reports WHERE report_id = $1`,
      [report_id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const reportOwnerId = reportResult.rows[0].user_id;

    if (role === 'employee') {
      return res.status(403).json({ message: 'Employees cannot comment on reports' });
    }

    if (role === 'hr' && reportOwnerId === reviewed_by) {
      return res.status(403).json({ message: 'HR cannot comment on their own reports' });
    }

    const updated = await addComment(
      report_id,
      comment,
      status || 'Reviewed',
      reviewed_by
    );

    res.status(200).json(updated);
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ message: 'Comment error', error: err.message });
  }
};



const exportReports = async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await getAllReports(userId);
    const fields = ['report_id', 'user_id', 'name', 'content', 'frequency', 'comment', 'status', 'date_submitted'];
    const parser = new Parser({ fields });
    const csv = parser.parse(reports);
    const fileName = userId ? `work_reports_${userId}.csv` : `work_reports_all.csv`;
    const filePath = path.join(__dirname, '../uploads', fileName);
    fs.writeFileSync(filePath, csv);
    res.download(filePath, fileName);
  } catch (err) {
    res.status(500).json({ message: 'Export error', error: err.message });
  }
};

const getMyReports = async (req, res) => {
    const userId = req.user?.userId;

  try {
    const reports = await db.query(
      `SELECT * FROM work_reports WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.status(200).json(reports.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your reports', error: error.message });
  }
};

module.exports = {
  submitWorkReport,
  viewReports,
  commentOnReport, 
  getMyReports,
  exportReports,
};
