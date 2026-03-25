/**
 * Export Service - Generates downloadable files in multiple formats.
 * Supports JSON, CSV, Markdown, and DOCX exports with Jira Epic/Story format.
 */
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const EXPORT_DIR = path.join(__dirname, '..', '..', 'data');

/**
 * Export epics & user stories in the specified format.
 * @param {Array} stories - Array of page story objects with epics
 * @param {string} format - Export format (json|csv|md|docx)
 * @returns {Promise<Object>} File path and content type info
 */
async function exportStories(stories, format = 'json') {
  const timestamp = Date.now();

  switch (format.toLowerCase()) {
    case 'json': return exportJSON(stories, timestamp);
    case 'csv': return exportCSV(stories, timestamp);
    case 'md':
    case 'markdown': return exportMarkdown(stories, timestamp);
    case 'docx': return exportDOCX(stories, timestamp);
    default: throw new Error(`Unsupported format: ${format}`);
  }
}

/** Export as formatted JSON. */
function exportJSON(stories, timestamp) {
  const filename = `ba_copilot_export_${timestamp}.json`;
  const filepath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(stories, null, 2));
  return { filepath, filename, contentType: 'application/json' };
}

/** Export as CSV with columns: Page, Epic, StoryTitle, UserStory, AcceptanceCriteria */
function exportCSV(stories, timestamp) {
  const filename = `ba_copilot_export_${timestamp}.csv`;
  const filepath = path.join(EXPORT_DIR, filename);

  const rows = ['"Page","Epic","Story Title","User Story","Acceptance Criteria"'];
  stories.forEach(pageStory => {
    (pageStory.epics || []).forEach(epic => {
      (epic.user_stories || []).forEach(story => {
        const ac = (story.acceptance_criteria || []).join('; ');
        rows.push(`"${esc(pageStory.page || pageStory.title)}","${esc(epic.summary)}","${esc(story.title)}","${esc(story.story)}","${esc(ac)}"`);
      });
    });
  });

  fs.writeFileSync(filepath, rows.join('\n'));
  return { filepath, filename, contentType: 'text/csv' };
}

/** Export as Markdown in Jira Epic/Story format. */
function exportMarkdown(stories, timestamp) {
  const filename = `ba_copilot_export_${timestamp}.md`;
  const filepath = path.join(EXPORT_DIR, filename);

  let md = `# BA Copilot — Epics & User Stories Report\n\nGenerated: ${new Date().toISOString()}\n\n---\n\n`;

  stories.forEach(pageStory => {
    md += `## Page: ${pageStory.title || pageStory.page}\n\n`;
    md += `**URL:** ${pageStory.page}\n\n`;

    (pageStory.epics || []).forEach((epic, i) => {
      md += `### Epic ${i + 1}: ${epic.summary}\n\n`;

      if (epic.description) md += `**Description:** ${epic.description}\n\n`;

      if (epic.requirements?.length > 0) {
        md += `**Requirements:**\n`;
        epic.requirements.forEach(r => { md += `- ${r}\n`; });
        md += '\n';
      }

      if (epic.scope) md += `**Scope:** ${epic.scope}\n\n`;

      if (epic.dependencies?.length > 0) {
        md += `**Dependencies:**\n`;
        epic.dependencies.forEach(d => { md += `- ${d}\n`; });
        md += '\n';
      }

      if (epic.risks?.length > 0) {
        md += `**Risks:**\n`;
        epic.risks.forEach(r => { md += `- ⚠️ ${r}\n`; });
        md += '\n';
      }

      if (epic.acceptance_criteria?.length > 0) {
        md += `**Acceptance Criteria:**\n`;
        epic.acceptance_criteria.forEach(ac => { md += `- ✅ ${ac}\n`; });
        md += '\n';
      }

      md += `#### User Stories\n\n`;
      (epic.user_stories || []).forEach((story, j) => {
        md += `**${j + 1}. ${story.title || 'User Story'}**\n\n`;
        md += `> ${story.story}\n\n`;
        if (story.description) md += `${story.description}\n\n`;
        if (story.acceptance_criteria?.length > 0) {
          md += `Acceptance Criteria:\n`;
          story.acceptance_criteria.forEach(ac => { md += `- ✅ ${ac}\n`; });
          md += '\n';
        }
      });

      md += '---\n\n';
    });
  });

  fs.writeFileSync(filepath, md);
  return { filepath, filename, contentType: 'text/markdown' };
}

/** Export as DOCX in Jira Epic/Story format. */
async function exportDOCX(stories, timestamp) {
  const filename = `ba_copilot_export_${timestamp}.docx`;
  const filepath = path.join(EXPORT_DIR, filename);

  const children = [
    new Paragraph({ text: 'BA Copilot — Epics & User Stories Report', heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `Generated: ${new Date().toISOString()}`, italics: true })] }),
    new Paragraph({ text: '' })
  ];

  stories.forEach(pageStory => {
    children.push(new Paragraph({ text: pageStory.title || pageStory.page, heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: `URL: ${pageStory.page}`, color: '666666' })] }));

    (pageStory.epics || []).forEach((epic, i) => {
      children.push(new Paragraph({ text: `Epic ${i + 1}: ${epic.summary}`, heading: HeadingLevel.HEADING_2 }));

      if (epic.description) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'Description: ', bold: true }), new TextRun(epic.description)] }));
      }

      if (epic.requirements?.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'Requirements:', bold: true })] }));
        epic.requirements.forEach(r => { children.push(new Paragraph({ children: [new TextRun(`  • ${r}`)] })); });
      }

      if (epic.acceptance_criteria?.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'Acceptance Criteria:', bold: true })] }));
        epic.acceptance_criteria.forEach(ac => { children.push(new Paragraph({ children: [new TextRun(`  ✅ ${ac}`)] })); });
      }

      children.push(new Paragraph({ text: 'User Stories', heading: HeadingLevel.HEADING_3 }));
      (epic.user_stories || []).forEach((story, j) => {
        children.push(new Paragraph({ children: [new TextRun({ text: `${j + 1}. ${story.title}`, bold: true })] }));
        children.push(new Paragraph({ children: [new TextRun({ text: story.story, italics: true })] }));
        if (story.description) {
          children.push(new Paragraph({ children: [new TextRun(story.description)] }));
        }
        if (story.acceptance_criteria?.length > 0) {
          story.acceptance_criteria.forEach(ac => { children.push(new Paragraph({ children: [new TextRun(`  ✅ ${ac}`)] })); });
        }
        children.push(new Paragraph({ text: '' }));
      });
    });

    children.push(new Paragraph({ text: '' }));
  });

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filepath, buffer);
  return { filepath, filename, contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
}

/** Escape double quotes for CSV. */
function esc(str) {
  return (str || '').replace(/"/g, '""');
}

module.exports = { exportStories };
