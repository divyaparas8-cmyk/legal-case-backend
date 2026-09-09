-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: acela.proxy.rlwy.net:32315
-- Generation Time: Jul 29, 2026 at 09:21 AM
-- Server version: 9.4.0
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `railway`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` int NOT NULL,
  `matter_id` int DEFAULT NULL,
  `actor_user_id` int DEFAULT NULL,
  `entity_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `action` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`id`, `matter_id`, `actor_user_id`, `entity_type`, `entity_id`, `action`, `description`, `created_at`) VALUES
(41, 8, 1, 'TimeEntry', 88, 'Historical Time Entry', 'Time Entry Historical Data:\nActivity: Time Entry\nNote: Flat rate\nRate: 2000.0 USD\nTotal: 2000.0 USD\nBilled State: 4', '2026-07-11 09:40:57.590'),
(42, 8, 1, 'TimeEntry', 89, 'Historical Time Entry', 'Time Entry Historical Data:\nActivity: Time Entry\nNote: Medical Records and Logged\nRate: 0.0 USD\nTotal: 0.0 USD\nBilled State: 9', '2026-07-11 09:40:57.597'),
(44, 11, 1, 'TimeEntry', 91, 'Historical Time Entry', 'Time Entry Historical Data:\nActivity: Time Entry\nNote: Flat rate\nRate: 5000.0 USD\nTotal: 5000.0 USD\nBilled State: 0', '2026-07-11 09:40:57.607'),
(45, 11, 1, 'TimeEntry', 92, 'Historical Time Entry', 'Time Entry Historical Data:\nActivity: Time Entry\nNote: Settlement Attempt\nRate: 0.0 USD\nTotal: 0.0 USD\nBilled State: 0', '2026-07-11 09:40:57.612'),
(46, 17, 1, 'TimeEntry', 93, 'Historical Time Entry', 'Time Entry Historical Data:\nActivity: Time Entry\nNote: Case Intake & Initial Strategy Conference\n1.2 hours\n\nInitial consultation and factual intake\n\nReview of employment history and probationary status\n\nDiscussion of medical conditions and accommodation requests\n\nStrategic assessment of claims under Rehab Act and Title VII\nRate: 350.0 USD\nTotal: 420.0 USD\nBilled State: 4', '2026-07-11 09:40:57.617'),
(47, 17, 1, 'TimeEntry', 94, 'Historical Time Entry', 'Time Entry Historical Data:\nActivity: Time Entry\nNote: Document Review & Chronology Analysis\n2.3 hours\n\nReview of Reasonable Accommodation requests and determinations\n\nReview of EEO Counselor Notices\n\nReview of termination documentation\n\nReview of scholarship (EISP) obligations and related directives\n\nReview of employee-drafted case summary\n\nDevelopment of detailed chronological timeline\nRate: 350.0 USD\nTotal: 805.0 USD\nBilled State: 4', '2026-07-11 09:40:57.622'),
(48, 17, 1, 'TimeEntry', 95, 'Historical Time Entry', 'Time Entry Historical Data:\nActivity: Time Entry\nNote: Legal Research & Statutory Analysis\n1.8 hours\n\nResearch regarding federal-sector “make whole” remedies\n\nAnalysis of Rehabilitation Act standards\n\nReview of VA Handbook and VHA Directive requirements\n\nResearch on front pay, compensatory caps, and fee-shifting\n\nReview of 180-day appointment rule implications.\nRate: 350.0 USD\nTotal: 630.0 USD\nBilled State: 4', '2026-07-11 09:40:57.627'),
(49, 17, 1, 'TimeEntry', 96, 'Historical Time Entry', 'Time Entry Historical Data:\nActivity: Time Entry\nNote: Mediation Preparation & Agreement Execution\n0.7 hours\n\nReview and execution of Agreement to Mediate\n\nAnalysis of confidentiality provisions under ADRA\n\nPreliminary mediation positioning\nRate: 350.0 USD\nTotal: 245.0 USD\nBilled State: 4', '2026-07-11 09:40:57.632'),
(50, 17, 1, 'TimeEntry', 97, 'Historical Time Entry', 'Time Entry Historical Data:\nActivity: Time Entry\nNote: Client Counseling & Strategy Sessions\n2.0 hours\n\nCounseling regarding reinstatement vs. separation remedies\n\nDiscussion of damages model (back pay, front pay, vesting impact)\n\nDiscussion of scholarship waiver exposure\n\nMediation preparation and settlement posture\nRate: 350.0 USD\nTotal: 700.0 USD\nBilled State: 4', '2026-07-11 09:40:57.637'),
(51, NULL, 1, 'communication', 64, 'created', 'Email log logged by Victoria Admin (admin)', '2026-07-14 11:45:06.964'),
(52, NULL, 1, 'communication', 65, 'created', 'Email log logged by Victoria Admin (admin)', '2026-07-14 11:57:24.320'),
(69, NULL, 1, 'communication', 67, 'created', 'Email log logged by Victoria Admin (admin)', '2026-07-15 09:40:44.661'),
(70, NULL, 1, 'communication', 68, 'created', 'Email log logged by Victoria Admin (admin)', '2026-07-15 09:51:01.788'),
(71, NULL, 1, 'communication', 69, 'created', 'Email log logged by Victoria Admin (admin)', '2026-07-15 09:53:48.708'),
(72, NULL, NULL, 'lead', 2, 'updated', 'Lead updated: status changed to referred', '2026-07-17 09:15:47.945'),
(73, NULL, NULL, 'lead', 2, 'updated', 'Lead updated: status changed to referred', '2026-07-17 09:15:56.735'),
(74, NULL, 1, 'client', 21, 'converted_from_lead', 'Client created from Lead #2', '2026-07-17 09:15:59.340'),
(75, NULL, NULL, 'lead', 2, 'updated', 'Lead updated: status changed to referred', '2026-07-17 09:16:27.812'),
(76, NULL, 1, 'client', 22, 'converted_from_lead', 'Client created from Lead #2', '2026-07-17 09:16:29.965'),
(77, NULL, NULL, 'lead', 3, 'created', 'Lead created for rygdc', '2026-07-17 09:28:04.175'),
(78, 20, 1, 'document', 20, 'uploaded', 'Document uploaded: 1784320163252-Invoice-INV-2026-0004.pdf', '2026-07-17 20:29:24.158'),
(197, 20, 1, 'document', 140, 'generated', 'Court form generated: CM-010_matter-20_1784561241052.pdf', '2026-07-20 15:27:22.712'),
(201, 13, 1, 'document', 144, 'generated', 'Court form generated: ADR-100_matter-13_1784614802201.pdf', '2026-07-21 06:20:06.310'),
(215, 20, 1, 'document', 158, 'uploaded', 'Document uploaded: 1784870169095-legalCase__1_.pdf', '2026-07-24 05:16:09.473'),
(216, 8, 1, 'document', 159, 'generated', 'Court form generated: CM-010_matter-8_1784870352774.pdf', '2026-07-24 05:19:12.809'),
(217, 22, 1, 'matter', 22, 'created', 'Matter MT-00009 created: VkTori', '2026-07-24 06:01:05.578'),
(218, NULL, NULL, 'lead', 4, 'created', 'Lead created for Client First', '2026-07-24 06:09:41.179'),
(219, 14, 1, 'document', 160, 'uploaded', 'Document uploaded: 1784876364082-ledger_statement_2026-07-22__1_.csv', '2026-07-24 06:59:24.181'),
(220, 17, 1, 'document', 161, 'generated', 'Court form generated: AO-085_matter-17_1784877348153.pdf', '2026-07-24 07:15:48.195'),
(221, 22, 1, 'document', 162, 'uploaded', 'Document uploaded: 1784878566610-report-1.pdf', '2026-07-24 07:36:07.417'),
(222, 23, 1, 'matter', 23, 'created', 'Matter MT-00010 created: wert', '2026-07-24 07:54:06.993'),
(223, 24, 9, 'matter', 24, 'created', 'Matter MT-00011 created: test', '2026-07-24 07:57:35.776'),
(224, 22, 3, 'communication', 222, 'created', 'Portal message logged by Sarah mitchell (client)', '2026-07-24 09:01:16.061'),
(225, 22, 3, 'communication', 223, 'created', 'Portal message logged by Sarah mitchell (client)', '2026-07-24 09:01:16.579'),
(226, 24, 10, 'communication', 224, 'created', 'Email log logged by Sourabh (client)', '2026-07-24 09:06:04.493'),
(227, 22, 9, 'communication', 225, 'created', 'Portal message logged by lawyer john (lawyer)', '2026-07-25 05:36:22.974'),
(228, 22, 1, 'document', 163, 'uploaded', 'Document uploaded: 1785220553801-Untitled_document__4_.pdf', '2026-07-28 06:35:57.340'),
(229, 22, 1, 'document', 164, 'uploaded', 'Document uploaded: 1785220591073-Untitled_document__4_.pdf', '2026-07-28 06:36:34.701');

-- --------------------------------------------------------

--
-- Table structure for table `calendar_categories`
--

CREATE TABLE `calendar_categories` (
  `id` int NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `calendar_categories`
--

INSERT INTO `calendar_categories` (`id`, `name`, `color`, `created_at`, `updated_at`, `is_active`, `sort_order`) VALUES
(1, 'Hearing', '#ef4444', '2026-07-16 08:59:41.694', '2026-07-17 09:08:57.111', 1, 3),
(2, 'Meeting', '#10b981', '2026-07-16 08:59:41.694', '2026-07-16 12:59:03.852', 1, 3),
(3, 'Deadline', '#f59e0b', '2026-07-16 08:59:41.694', '2026-07-17 09:29:36.456', 1, 0),
(4, 'Consultation', '#38bdf8', '2026-07-16 08:59:41.694', '2026-07-17 09:29:36.256', 1, 1),
(5, 'Case Review', '#8b5cf6', '2026-07-16 08:59:41.694', '2026-07-17 09:29:35.514', 1, 2),
(6, 'Personal', '#ec4899', '2026-07-16 08:59:41.694', '2026-07-16 12:59:09.878', 1, 4);

-- --------------------------------------------------------

--
-- Table structure for table `calendar_events`
--

CREATE TABLE `calendar_events` (
  `id` int NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` datetime(3) NOT NULL,
  `matter_id` int DEFAULT NULL,
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `court_related` tinyint(1) NOT NULL DEFAULT '0',
  `end_date` datetime(3) DEFAULT NULL,
  `event_status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `reminder_date` datetime(3) DEFAULT NULL,
  `reminder_sent` tinyint(1) NOT NULL DEFAULT '0',
  `titan_event_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `appearance_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `court_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `court_room` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_court_event` tinyint(1) NOT NULL DEFAULT '0',
  `judge_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reminder_sent_1d` tinyint(1) NOT NULL DEFAULT '0',
  `reminder_sent_3d` tinyint(1) NOT NULL DEFAULT '0',
  `reminder_sent_7d` tinyint(1) NOT NULL DEFAULT '0',
  `reminder_sent_same_day` tinyint(1) NOT NULL DEFAULT '0',
  `create_task` tinyint(1) NOT NULL DEFAULT '0',
  `activity_id` int DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `busy_status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categories` json DEFAULT NULL,
  `is_all_day` tinyint(1) NOT NULL DEFAULT '0',
  `location` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `outlook_event_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `outlook_series_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recurrence_rule` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timezone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `importance` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `is_online_meeting` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `calendar_events`
--

INSERT INTO `calendar_events` (`id`, `title`, `event_date`, `matter_id`, `type`, `description`, `created_by`, `created_at`, `court_related`, `end_date`, `event_status`, `reminder_date`, `reminder_sent`, `titan_event_id`, `appearance_type`, `court_name`, `court_room`, `is_court_event`, `judge_name`, `reminder_sent_1d`, `reminder_sent_3d`, `reminder_sent_7d`, `reminder_sent_same_day`, `create_task`, `activity_id`, `attachments`, `busy_status`, `categories`, `is_all_day`, `location`, `outlook_event_id`, `outlook_series_id`, `recurrence_rule`, `timezone`, `importance`, `is_online_meeting`) VALUES
(16, 'hearing', '2026-07-14 03:30:00.000', NULL, 'meeting', 'test', 1, '2026-07-14 07:50:34.457', 0, '2026-07-14 04:30:00.000', 'scheduled', '2026-07-13 21:55:00.000', 0, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, 0, 0, 0, NULL, '[{\"id\": \"att_1784015429491_0\", \"url\": \"#\", \"name\": \"legal-case-management (8).sql\", \"size\": 117959, \"type\": \"\"}]', 'busy', '[\"Consultation\"]', 0, 'court', NULL, NULL, NULL, 'UTC', 'normal', 0),
(21, 'dgdg', '2026-07-17 08:00:00.000', NULL, 'meeting', NULL, 1, '2026-07-17 16:38:10.975', 0, '2026-07-17 00:30:00.000', 'scheduled', '2026-07-16 23:45:00.000', 0, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, 0, 0, 0, NULL, '[]', 'busy', '[]', 0, 'Inglewood ', NULL, NULL, NULL, 'UTC', 'normal', 0),
(22, 'dgdg', '2026-07-17 08:00:00.000', NULL, 'meeting', NULL, 1, '2026-07-17 16:38:12.481', 0, '2026-07-17 00:30:00.000', 'scheduled', '2026-07-16 23:45:00.000', 0, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, 0, 0, 0, NULL, '[]', 'busy', '[]', 0, 'Inglewood ', NULL, NULL, NULL, 'UTC', 'normal', 0),
(23, 'dgdg', '2026-07-17 08:00:00.000', NULL, 'meeting', NULL, 1, '2026-07-17 16:38:14.132', 0, '2026-07-17 00:30:00.000', 'scheduled', '2026-07-16 23:45:00.000', 0, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, 0, 0, 0, NULL, '[]', 'busy', '[]', 0, 'Inglewood ', NULL, NULL, NULL, 'UTC', 'normal', 0),
(24, 'Filing Deadline: VkTori', '2026-07-25 00:00:00.000', 22, 'filing_deadline', 'Auto-synced from matter MT-00009', 1, '2026-07-24 06:01:05.503', 1, NULL, 'scheduled', NULL, 0, NULL, NULL, NULL, NULL, 1, NULL, 1, 0, 0, 0, 0, NULL, 'null', 'busy', 'null', 0, NULL, NULL, NULL, NULL, 'UTC', 'normal', 0),
(25, 'Trial: VkTori', '2026-07-24 00:00:00.000', 22, 'trial', 'Auto-synced from matter MT-00009', 1, '2026-07-24 06:01:05.560', 1, NULL, 'scheduled', NULL, 0, NULL, NULL, NULL, NULL, 1, NULL, 0, 0, 0, 0, 0, NULL, 'null', 'busy', 'null', 0, NULL, NULL, NULL, NULL, 'UTC', 'normal', 0);

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `full_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line_1` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_line_2` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_portal_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `business_address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_first_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_last_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organization_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `party_role` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Client',
  `party_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Individual',
  `home_address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opposing_counsel_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opposing_law_firm` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opposing_party_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` datetime(3) DEFAULT NULL,
  `government_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `insurance_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `clients`
--

INSERT INTO `clients` (`id`, `user_id`, `full_name`, `email`, `phone`, `address_line_1`, `address_line_2`, `city`, `state`, `postal_code`, `notes`, `is_portal_enabled`, `created_at`, `updated_at`, `business_address`, `contact_first_name`, `contact_last_name`, `organization_name`, `party_role`, `party_type`, `home_address`, `opposing_counsel_name`, `opposing_law_firm`, `opposing_party_name`, `date_of_birth`, `government_id`, `insurance_number`) VALUES
(1, 3, 'Sarah mitchell', 'client@vktori.com', '147852841', NULL, NULL, NULL, NULL, NULL, '', 1, '2026-04-21 12:47:06.360', '2026-04-22 10:08:39.201', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(9, NULL, 'Gill victoria Cabler Sampson', 'gillvictoriacablersampson@placeholder.local', '(310) 555-0192', '742 Evergreen Terrace', NULL, 'Los Angeles', 'CA', '90001', NULL, 0, '2026-07-11 07:20:59.925', '2026-07-17 09:02:55.180', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, NULL, 'Kathy McMillan-Blake', 'kathymcmillanblake@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-07-11 07:20:59.938', '2026-07-11 07:20:59.938', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(11, NULL, 'Mohamed Aaron Lamin', 'mohamedaaronlamin@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-07-11 07:20:59.947', '2026-07-11 07:20:59.947', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(12, NULL, 'John Alvin McKinney', 'johnalvinmckinney@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-07-11 07:20:59.957', '2026-07-11 07:20:59.957', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, NULL, 'DMG Wellness', 'dmgwellness@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-07-11 07:20:59.965', '2026-07-11 07:20:59.965', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(14, NULL, 'Abdul Sesay', 'abdulsesay@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-07-11 07:20:59.972', '2026-07-11 07:20:59.972', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(15, NULL, 'Ibrahim Daramy', 'ibrahimdaramy@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-07-11 07:20:59.981', '2026-07-11 07:20:59.981', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(16, NULL, 'Aliyah Wilson', 'aliyahwilson@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, '====================================================\n\n[CLIO CONTACT NOTE]\n\nImported On:\n2026-07-11\n\nOriginal Date:\n1/31/2026, 12:00:00 AM\n\nOriginal Author:\nVictoria Tulsidas, Esq.\n\nSubject:\nClient Notes 01 29 2026\n\n----------------------------------------\n\nClient Notes – Title 8 CCR §334.2Client Overview<ul>  <li><strong>Client Role:</strong> Certified Nursing Assistant (CNA)</li>  <li><strong>Worksite:</strong> Prison/Jail Facility – Lancaster, California</li>  <li><strong>Employment Status:</strong> Full-time</li>  <li><strong>Schedule:</strong> Monday–Friday, 7:00 a.m. – 3:00 p.m.</li>  <li><strong>Hourly Rate:</strong> $29/hour</li>  <li><strong>Start Date:</strong> April 2025</li>  <li><strong>Prior Employment:</strong> Home health agency</li>  <li><strong>Employment Contract:</strong> 12-month full employment contract    <ul>      <li><strong>Renewal Date:</strong> July 7, 2025</li>    </ul>  </li></ul>Job Duties<ul>  <li>Works directly with incarcerated patients</li>  <li>Provides support to nursing staff</li>  <li>Frequently on feet during shifts</li>  <li>Periods of prolonged sitting during suicide watch assignments</li></ul>Applicable Regulation<ul>  <li><strong>Title 8 California Code of Regulations (CCR) §334.2</strong>    <ul>      <li>Workplace safety requirements</li>      <li>Heat exposure and environmental conditions</li>      <li>Employer duty to provide a safe and healthful workplace</li>    </ul>  </li></ul>Heat Exposure &amp; Environmental Conditions<ul>  <li>Facility <strong>lacks air conditioning</strong></li>  <li>Client reports <strong>extreme heat exposure</strong> during shifts</li>  <li>Heat exposure brought to attention of senior management    <ul>      <li><strong>Manager Notified:</strong> Victor (senior management / warehouse)</li>      <li><strong>Management Response:</strong> Acknowledged no AC in facility</li>    </ul>  </li>  <li>Potential violations related to:    <ul>      <li>Excessive heat</li>      <li>Failure to mitigate known hazardous conditions</li>    </ul>  </li></ul>Break and Meal Period Violations<ul>  <li>Only scheduled break is a <strong>30-minute lunch</strong></li>  <li><strong>No 10-minute rest breaks provided</strong></li>  <li>At times, <strong>30-minute lunch is also missed or interrupted</strong></li>  <li>Pattern suggests:    <ul>      <li>Systemic denial of legally required rest periods</li>      <li>Wage and hour implications in addition to safety concerns</li>    </ul>  </li></ul>Hazardous Substance Exposure<ul>  <li>Exposure to <strong>illicit drugs</strong>, specifically:    <ul>      <li><strong>“Spice”</strong> being created, smoked, or used by inmates</li>    </ul>  </li>  <li>Exposure occurs within the workplace environment</li>  <li>Raises concerns regarding:    <ul>      <li>Air quality</li>      <li>Secondhand exposure</li>      <li>Employer failure to control known hazards</li>    </ul>  </li></ul>Workplace Violence &amp; Harassment<ul>  <li>Client reports <strong>workplace violence and harassment</strong></li>  <li><strong>Alleged Perpetrator:</strong>    <ul>      <li>Name: Eileen Alvarez</li>      <li>Gender: Female</li>      <li>Approx. Height: 5’5”</li>      <li>Approx. Weight: 180 lbs</li>      <li>Relationship: Co-worker</li>    </ul>  </li>  <li>Nature of conduct: <strong>Details to be provided</strong></li>  <li>Potential issues include:    <ul>      <li>Failure to prevent workplace violence</li>      <li>Failure to investigate or remediate harassment</li>      <li>Retaliation risk</li>    </ul>  </li></ul>Risk &amp; Liability Considerations (Preliminary)<ul>  <li>Known unsafe conditions acknowledged by management</li>  <li>Repeated exposure to extreme heat</li>  <li>Failure to provide required breaks</li>  <li>Exposure to controlled substances in workplace</li>  <li>Allegations of violence/harassment by co-worker</li>  <li>Client is under a renewable contract nearing expiration (retaliation timing risk)</li></ul>Next Steps / To Be Added<ul>  <li>Detailed facts of workplace violence incident(s)</li>  <li>Any written complaints, emails, or reports made</li>  <li>Witnesses to heat exposure, break violations, or harassment</li>  <li>Medical symptoms or treatment related to heat or exposure</li>  <li>Employer policies on safety, breaks, and workplace violence</li>  <li>Cal/OSHA citation details (if available)</li></ul>\n\n====================================================', 0, '2026-07-11 07:20:59.989', '2026-07-11 10:12:20.653', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(17, NULL, 'Sheila Jones', 'sheilajones@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, '====================================================\n\n[CLIO CONTACT NOTE]\n\nImported On:\n2026-07-11\n\nOriginal Date:\n2/10/2026, 12:00:00 AM\n\nOriginal Author:\nVictoria Tulsidas, Esq.\n\nSubject:\nRequests for Records\n\n----------------------------------------\n\nRequests for Medical and/or Dental Records have been sent via first-class mail, certified mail, and online to the following:<br>American Medical Response<br>CVS Pharmacy<br>Loma Linda Medical Center<br>San Bernardino County Coroner<br>Western Dental\n\n====================================================', 0, '2026-07-11 07:20:59.996', '2026-07-11 10:12:20.658', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(18, NULL, 'Lovelace Abdullah', 'lovelaceabdullah@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-07-11 07:21:00.012', '2026-07-11 07:21:00.012', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, NULL, 'Erika Lillian Aldridge', 'erikalillianaldridge@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-07-11 07:21:00.019', '2026-07-11 07:21:00.019', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(20, NULL, 'Idrisa Kallay', 'idrisakallay@placeholder.local', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-07-11 07:21:00.030', '2026-07-17 11:57:41.827', NULL, NULL, NULL, NULL, 'Plaintiff', 'Individual', NULL, 'adfdsfad', 'asdf', 'aaa', NULL, NULL, NULL),
(21, NULL, 'Sample Lead', 'lead@example.com', '123-456-7890', NULL, NULL, NULL, NULL, NULL, 'Converted from lead. Original message: I need legal advice regarding my divorce.', 0, '2026-07-17 09:15:59.302', '2026-07-17 09:15:59.302', NULL, NULL, NULL, NULL, 'Client', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(22, NULL, 'Sample Leads', 'lead@example.com', '123-456-7890', NULL, NULL, NULL, NULL, NULL, 'Converted from lead. Original message: I need legal advice regarding my divorce.', 0, '2026-07-17 09:16:29.930', '2026-07-24 07:05:03.247', NULL, NULL, NULL, NULL, 'Petitioner', 'Individual', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(25, 10, 'Sourabh', 's@gmail.com', '323312121', NULL, NULL, NULL, NULL, NULL, 'jtgf', 0, '2026-07-24 07:57:33.478', '2026-07-24 07:57:33.478', NULL, NULL, NULL, NULL, 'Client', 'Individual', 'indore', NULL, NULL, NULL, '2026-07-24 00:00:00.000', '121', '2121');

-- --------------------------------------------------------

--
-- Table structure for table `communications`
--

CREATE TABLE `communications` (
  `id` int NOT NULL,
  `matter_id` int DEFAULT NULL,
  `sender_user_id` int NOT NULL,
  `sender_role` enum('admin','lawyer','client') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_body` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `visibility` enum('internal','client_shared','client_visible') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'internal',
  `communication_type` enum('portal_message','note','email_log','call_log','meeting_log','titan_email') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'portal_message',
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `parent_id` int DEFAULT NULL,
  `subject` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bcc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `to` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `activity_id` int DEFAULT NULL,
  `request_read_receipt` tinyint(1) NOT NULL DEFAULT '0',
  `track_opens` tinyint(1) NOT NULL DEFAULT '0',
  `opened` tinyint(1) NOT NULL DEFAULT '0',
  `opened_time` datetime(3) DEFAULT NULL,
  `open_count` int NOT NULL DEFAULT '0',
  `email_account_id` int DEFAULT NULL,
  `external_message_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_thread_id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `folder` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `in_reply_to` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `is_draft` tinyint(1) NOT NULL DEFAULT '0',
  `is_flagged` tinyint(1) NOT NULL DEFAULT '0',
  `is_spam` tinyint(1) NOT NULL DEFAULT '0',
  `is_starred` tinyint(1) NOT NULL DEFAULT '0',
  `references` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sync_status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `communications`
--

INSERT INTO `communications` (`id`, `matter_id`, `sender_user_id`, `sender_role`, `message_body`, `visibility`, `communication_type`, `is_read`, `read_at`, `created_at`, `updated_at`, `parent_id`, `subject`, `bcc`, `cc`, `to`, `activity_id`, `request_read_receipt`, `track_opens`, `opened`, `opened_time`, `open_count`, `email_account_id`, `external_message_id`, `external_thread_id`, `folder`, `in_reply_to`, `is_archived`, `is_deleted`, `is_draft`, `is_flagged`, `is_spam`, `is_starred`, `references`, `sync_status`) VALUES
(11, 14, 1, 'admin', '[Imported from Clio]\nOriginal Author: Victoria Tulsidas, Esq.\n--------------------\n\nClient Notes – Title 8 CCR §334.2Client Overview\n  Client Role: Certified Nursing Assistant (CNA)  Worksite: Prison/Jail Facility – Lancaster, California  Employment Status: Full-time  Schedule: Monday–Friday, 7:00 a.m. – 3:00 p.m.  Hourly Rate: $29/hour  Start Date: April 2025  Prior Employment: Home health agency  Employment Contract: 12-month full employment contract          Renewal Date: July 7, 2025      Job Duties  Works directly with incarcerated patients  Provides support to nursing staff  Frequently on feet during shifts  Periods of prolonged sitting during suicide watch assignmentsApplicable Regulation  Title 8 California Code of Regulations (CCR) §334.2          Workplace safety requirements      Heat exposure and environmental conditions      Employer duty to provide a safe and healthful workplace      Heat Exposure & Environmental Conditions  Facility lacks air conditioning  Client reports extreme heat exposure during shifts  Heat exposure brought to attention of senior management          Manager Notified: Victor (senior management / warehouse)      Management Response: Acknowledged no AC in facility        Potential violations related to:          Excessive heat      Failure to mitigate known hazardous conditions      Break and Meal Period Violations  Only scheduled break is a 30-minute lunch  No 10-minute rest breaks provided  At times, 30-minute lunch is also missed or interrupted  Pattern suggests:          Systemic denial of legally required rest periods      Wage and hour implications in addition to safety concerns      Hazardous Substance Exposure  Exposure to illicit drugs, specifically:          “Spice” being created, smoked, or used by inmates        Exposure occurs within the workplace environment  Raises concerns regarding:          Air quality      Secondhand exposure      Employer failure to control known hazards      Workplace Violence & Harassment  Client reports workplace violence and harassment  Alleged Perpetrator:          Name: Eileen Alvarez      Gender: Female      Approx. Height: 5’5”      Approx. Weight: 180 lbs      Relationship: Co-worker        Nature of conduct: Details to be provided  Potential issues include:          Failure to prevent workplace violence      Failure to investigate or remediate harassment      Retaliation risk      Risk & Liability Considerations (Preliminary)  Known unsafe conditions acknowledged by management  Repeated exposure to extreme heat  Failure to provide required breaks  Exposure to controlled substances in the workplace  Allegations of violence/harassment by a co-worker  Client is under a renewable contract nearing expiration (retaliation timing risk)Next Steps / To Be Added  Detailed facts of workplace violence incident(s)  Any written complaints, emails, or reports made  Witnesses to heat exposure, break violations, or harassment  Medical symptoms or treatment related to heat or exposure  Employer policies on safety, breaks, and workplace violence  Cal/OSHA citation details (if available)Fear for her safety \n\n\nClient says violence is repetitive.  The client says co-worker invaded her personal space 3-4 times and made contact with her. She reported all 4 incidents to Supervisor Olisa and Kristen Cooper.\n\n\nIncident 1 July/2025-Warehouse\n-Pushed Trash Cans towards another employee snatched papers out of hands and took pens out of the pockets of her scrubs.\n\n\nIncident 2 December 2nd  2025 On the Yard\n\n\nCo worker came up behind her from her left and hip shoved the client pushing to the right and said \"I got it \" referring to the cart. The client says she was already pushing the cart so there was no reason for her to come up from behind to take the cart. There was a correction office behind them but she is not sure if he saw it. However he was equipped with body cam.\n\n\nIncident 3 January 14th 2026- Yard inside housing unit behind podium\n\n\nInmate was approaching the client with questions, then co-worker approached shoved client with her left shoulder and got in front of her to talk to the inmate. She continued to stand in front of the client. The client told the co-worker not to touch her and the co-worker responded by saying dont talk to me like that. \n\n\nIncident 4 January 28, 2026\n\n\nClient walking to sign out with books. She saw the co-worker standing there in the hall near the sign out book, and before you could approach she said \"excuse me\". Client stopped walking towards the book and the co-worker then walked straight into her making contact.\n\n\nShe always makes contact with her shoulders and hips. Client does not recall her facial expression. The co-worker has not made any verbal threats. The client says she is afraid because it could escalate due to the repettition. She reiterates that she reported the first 3 incidents and the most were caught on surveillance. \n\n\nWhen she reported the issue to Hooper for December through January, she is told that the videos do not establish intent or could be validated. Hooper is the Chief Executive Nurse. They continue to have the client work with the same co-worker since July.', 'internal', 'note', 0, NULL, '2026-01-30 18:30:00.000', '2026-07-11 09:54:36.494', NULL, 'Workplace Violence and Abuse Claim', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(12, 13, 1, 'admin', '[Imported from Clio]\nOriginal Author: Victoria Tulsidas, Esq.\n--------------------\n\nLetter of Representation and Demand Letter sent by certified mail to Defendant(s), on 01/31/2026', 'internal', 'note', 0, NULL, '2026-02-01 18:30:00.000', '2026-07-11 09:54:36.499', NULL, 'Demand Letter', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(13, 11, 1, 'admin', '[Imported from Clio]\nOriginal Author: Victoria Tulsidas, Esq.\n--------------------\n\nCopy of invitation to settle sent to plaintiff counsel via first class mail.', 'internal', 'note', 0, NULL, '2026-02-02 18:30:00.000', '2026-07-11 09:54:36.503', NULL, 'Copy of Settlement Invitation Sent Via First Class Mail', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(18, 8, 1, 'admin', '[Imported from Clio]\nOriginal Author: Victoria Tulsidas, Esq.\n--------------------\n\nTo date the opposing party has not filed an answer to our complaint and we are now in active default.\nNext steps:\nFile statement of Damages\nReach out to Court Regarding the Motion on the Second Amended Complaint', 'internal', 'note', 0, NULL, '2026-02-23 18:30:00.000', '2026-07-11 09:54:36.519', NULL, 'Case Status', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(19, 15, 1, 'admin', '[Imported from Clio]\nOriginal Author: Victoria Tulsidas, Esq.\n--------------------\n\nOn February 26, 2026, at approximately 5:30 p.m., I spoke telephonically with defense counsel, Mr. Poliquin, regarding the upcoming conference scheduled for Tuesday, March 3, 2026. During that call, we discussed Plaintiff’s anticipated request for a continuance. Mr. Poliquin indicated Defendants’ position that two newly added parties were improperly included and stated that he likely intends to file a demurrer. He inquired whether Plaintiff would dismiss the parent company and the individual doctor; I advised that he may proceed with any responsive pleading he deems appropriate. Mr. Poliquin also asked whether Plaintiff had a settlement demand. I informed him I would confer with my client.\n\nAfter conferring with Plaintiff regarding valuation, including discussion of MICRA caps and applicable statutory limitations, Plaintiff authorized a settlement demand of $7,000,000.', 'internal', 'note', 0, NULL, '2026-02-25 18:30:00.000', '2026-07-11 09:54:36.521', NULL, 'Meet and Confer', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(20, 15, 1, 'admin', '[Imported from Clio]\nOriginal Author: Victoria Tulsidas, Esq.\n--------------------\n\nOn February 27, 2026, at approximately 1:31 p.m., I telephonically communicated the $7,000,000 settlement demand to Mr. Poliquin. He stated he would present the demand to his clients. The call concluded thereafter.', 'internal', 'note', 0, NULL, '2026-02-26 18:30:00.000', '2026-07-11 09:54:36.525', NULL, 'Settlment Offer Presented to Defense Counsel', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(21, 8, 1, 'admin', '[Imported from Clio]\nOriginal Author: Victoria Tulsidas, Esq.\n--------------------\n\n​Public Records Request Filed', 'internal', 'note', 0, NULL, '2026-03-01 18:30:00.000', '2026-07-11 09:54:36.528', NULL, 'CDPH P028891-030226', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(22, 15, 1, 'admin', '[Imported from Clio]\nOriginal Author: Victoria Tulsidas, Esq.\n--------------------\n\nRequest for Public Records was sent to CDPH P028892-030226', 'internal', 'note', 0, NULL, '2026-03-01 18:30:00.000', '2026-07-11 09:54:36.531', NULL, 'Requests for Records', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(24, 11, 1, 'admin', '[Imported from Clio]\nOriginal Author: Victoria Tulsidas, Esq.\n--------------------\n\nText sent to Client advised them that opposing counsel was open to negotiations. The client asked me to offer them 10K settlement offer.', 'internal', 'note', 0, NULL, '2026-03-18 18:30:00.000', '2026-07-11 09:54:36.536', NULL, 'Counter Offer', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(25, 8, 1, 'admin', 'Called to obtain copies of treatment logs and protocols. Left ma essage on voicemail for medical records.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4529526286', 'internal', 'call_log', 0, NULL, '2026-01-13 08:34:00.000', '2026-01-13 08:34:00.000', NULL, 'Medical Records and Logged', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(26, 8, 1, 'admin', 'Called to obtain fax or email address in order to obtain medical records. Sonia Prieto is the Medical Records DIrector her email address is Sonia.Prieto@linskhealth.com\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4529603041', 'internal', 'call_log', 0, NULL, '2026-01-13 09:03:00.000', '2026-01-13 09:03:00.000', NULL, 'Medical Records and Logs', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(27, 8, 1, 'admin', 'Email sent to Medical Records Director Sonia Prieto requesting the decedent\'s medical records and treatment logs.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4529708521', 'internal', 'email_log', 0, NULL, '2026-01-13 10:01:00.000', '2026-01-13 10:01:00.000', NULL, 'Medical Records and Logs', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(28, 8, 1, 'admin', 'Sonia, the Director of Medical records said she is in receipt of my email and will respond shortly.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4531683286', 'internal', 'call_log', 0, NULL, '2026-01-14 09:28:00.000', '2026-01-14 09:28:00.000', NULL, 'Follow Up on Written Request for Logs', NULL, NULL, 'Paramount Meadows Nursing Center LP Agent CTC', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(29, 8, 1, 'admin', 'Sent client a text message requesting a copy of the death certificate.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4531684546', 'internal', 'call_log', 0, NULL, '2026-01-14 09:28:00.000', '2026-01-14 09:28:00.000', NULL, 'Death Certificate', NULL, NULL, 'Kathy McMillan-Blake', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(30, 8, 1, 'admin', 'Left a message on voicemail with Stark Solutions LLC to speak with Aarika Pardino, DMSc\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4531692391', 'internal', 'call_log', 0, NULL, '2026-01-14 09:32:00.000', '2026-01-14 09:32:00.000', NULL, 'Medical Expert', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(31, 8, 1, 'admin', 'Sent email to Medical expert to place her on notice that case is schedule for pleadings on 1/21/26\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4531696171', 'internal', 'email_log', 0, NULL, '2026-01-14 09:34:00.000', '2026-01-14 09:34:00.000', NULL, 'Contact to Medical Expert', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(32, 8, 1, 'admin', 'Dear Kathy McMillan-Blake,\n\nYour bill is ready. You can see your account summary below.\n\nThank you for your business.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4535075311', 'internal', 'email_log', 0, NULL, '2026-01-16 05:26:00.000', '2026-01-16 05:26:00.000', NULL, 'Bill \'1\': A bill from Law Office of Victoria Tulsidas', NULL, NULL, 'Kathy McMillan-Blake', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(33, 11, 1, 'admin', 'Left a message with Secretary Michelle for Mr. Koonce to discuss a possible settlement.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4558230736', 'internal', 'call_log', 0, NULL, '2026-02-02 03:43:00.000', '2026-02-02 03:43:00.000', NULL, 'Settlement Attempt', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(34, 13, 1, 'admin', 'Demand Letter emailed to S. Sweeney, Counsel for the defendant, contact provided by the Plaintiff.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4558254091', 'internal', 'email_log', 0, NULL, '2026-02-02 03:49:00.000', '2026-02-02 03:49:00.000', NULL, 'Demand Letter', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(35, 15, 1, 'admin', 'Dear Sheila Jones,\n\nYour bill is ready. You can see your account summary below.\n\nThank you for your business.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4559610016', 'internal', 'email_log', 0, NULL, '2026-02-02 09:36:00.000', '2026-02-02 09:36:00.000', NULL, 'Bill \'2\': A bill from Law Office of Victoria Tulsidas', NULL, NULL, 'Sheila Jones', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(36, 15, 1, 'admin', 'Called Nadia Vann left message on vm 323.408.0960\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4562660761', 'internal', 'call_log', 0, NULL, '2026-02-03 09:07:00.000', '2026-02-03 09:07:00.000', NULL, 'Called Plaintiff Witness Nadia Vann', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(37, 15, 1, 'admin', 'Called Nadia Vann left message on vm 562.579.9567\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4562663986', 'internal', 'call_log', 0, NULL, '2026-02-03 09:07:00.000', '2026-02-03 09:07:00.000', NULL, 'Called Plaintiff Witness Nadia Vann', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(38, 15, 1, 'admin', 'Called Client to inquire about facts of the case and to request access to pictures she shared from her Google drive.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4562667061', 'internal', 'call_log', 0, NULL, '2026-02-03 09:08:00.000', '2026-02-03 09:08:00.000', NULL, 'Called Client', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(39, 15, 1, 'admin', 'Reached out to Potential Medical Expert for Advise on Guidance on the case\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4562670346', 'internal', 'call_log', 0, NULL, '2026-02-03 09:08:00.000', '2026-02-03 09:08:00.000', NULL, 'Medical Expert', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(40, 11, 1, 'admin', 'An invitation to settlement negotiations was sent to the Frank Law group attention to Gregory Koonce and David Frank.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4562763856', 'internal', 'email_log', 0, NULL, '2026-02-03 09:26:00.000', '2026-02-03 09:26:00.000', NULL, 'Invitation to Settlement Negotiations', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(42, 13, 1, 'admin', 'Good morning, Ibrahim,\n\nI hope you’re having a good week.\n\nI wanted to provide you with a brief weekly update. To date, we have not heard from opposing counsel. They still have until the 17th of this month to respond to our demands, and at this point, I have not followed up, as we are allowing the full demand period to run.\n\nAccordingly, we are still within the 14-day demand window, which does not expire until the 17th.\n\nSeparately, I did happen to drive by one of their facilities and observed signage stating “We Love LA,” which I found notable given the circumstances. That said, our focus remains on allowing the demand period to conclude and proceeding strategically based on their response—or lack thereof.\n\nPlease feel free to reach out if you have any questions. I’ll continue to keep you informed as things develop.\n\nBest regards,\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4575166561', 'internal', 'email_log', 0, NULL, '2026-02-09 04:19:00.000', '2026-02-09 04:19:00.000', NULL, 'Status update', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(43, 14, 1, 'admin', 'Good morning, Aaliyah,\n\nI hope you are doing well.\n\nI wanted to provide you with a brief status update on your matter. At this point, we are likely to proceed either with mediation or a formal demand, depending on how the next step develops.\n\nI am currently waiting to hear back from Mr. Lopez regarding the citation. Once that information is received and reviewed, we will be in a position to move forward accordingly.\n\nIn the meantime, please feel free to reach out to me if anything has changed at work, if any new issues have emerged, or if you have additional information that you believe is relevant. Otherwise, we will allow this process to play out and proceed once the outstanding item is resolved.\n\nAs always, I will keep you updated as things progress.\n\nBest regards,\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4575172786', 'internal', 'email_log', 0, NULL, '2026-02-09 04:20:00.000', '2026-02-09 04:20:00.000', NULL, 'Status update', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(44, 12, 1, 'admin', 'Good morning, Mr. Sesay,\n\nI hope you are doing well. I wanted to provide you with a brief status update on your case. As of today, it has been seven (7) days since my last conversation with the insurance adjuster, who indicated that he would need approximately seven days to review the claims.\n\nI will be sending a follow-up email to the adjuster today to check on the status of that review. In the meantime, I wanted to place you on notice of where things currently stand.\n\nUntil we receive a response, there is nothing further required from you at this time. As always, if anything has changed on your end or if you have any questions, please do not hesitate to reach out.\n\nI will keep you updated as soon as I hear back.\n\nBest regards,\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4575206386', 'internal', 'email_log', 0, NULL, '2026-02-09 04:29:00.000', '2026-02-09 04:29:00.000', NULL, 'Status update', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(45, 17, 1, 'admin', 'Dear Ms Abdullah,\n\nYour bill is ready. You can see your account summary below. You may make payment via Zelle to (323) 830-3145\n\nThank you for your business.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4582362991', 'internal', 'email_log', 0, NULL, '2026-02-11 12:28:00.000', '2026-02-11 12:28:00.000', NULL, 'Bill \'4\': A bill from Law Office of Victoria Tulsidas', NULL, NULL, 'Lovelace Abdullah', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(46, 17, 1, 'admin', 'Dear Ms. Abdullah,\n\nYour bill is ready. You can see your account summary below.\n\nThank you for your business.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4583971651', 'internal', 'email_log', 0, NULL, '2026-02-12 07:59:00.000', '2026-02-12 07:59:00.000', NULL, 'Bill \'4\': A bill from Law Office of Victoria Tulsidas', NULL, NULL, 'Lovelace Abdullah', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(47, 14, 1, 'admin', 'Received an email from CDR\'s counsel acknowledging us as counsel for Aliyah Wilson.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4601663896', 'internal', 'email_log', 0, NULL, '2026-02-24 06:18:00.000', '2026-02-24 06:18:00.000', NULL, 'Reponse to our Letter of Representation', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(48, 14, 1, 'admin', 'Sent email responding to Counsel\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4601673631', 'internal', 'email_log', 0, NULL, '2026-02-24 06:20:00.000', '2026-02-24 06:20:00.000', NULL, 'Response', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(50, 17, 1, 'admin', 'Lmsg on vm for Re: upcoming mediation:\nBarbara Pepi\nEEO Specialist\nCell: 858-232-1982\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4610452306', 'internal', 'call_log', 0, NULL, '2026-02-27 09:10:00.000', '2026-02-27 09:10:00.000', NULL, 'Mediation Confirmation', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(51, 8, 1, 'admin', 'Lmsg on vm for Bryan Reid\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4614869671', 'internal', 'call_log', 0, NULL, '2026-03-02 04:31:00.000', '2026-03-02 04:31:00.000', NULL, 'Meet and Confer', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(52, 8, 1, 'admin', 'Lmsg on vm for Peter\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4614870436', 'internal', 'call_log', 0, NULL, '2026-03-02 04:32:00.000', '2026-03-02 04:32:00.000', NULL, 'Meet and Confer', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(53, 8, 1, 'admin', 'Counsel,\n\nI recently left messages for both of you regarding this matter and am following up in writing.\n\nI understand that correspondence inviting a meet and confer was sent to Plaintiff shortly before my substitution of attorney was filed. Now that I am counsel of record, please direct all future communications to my office. I would have reached out sooner had that correspondence come through me directly.\n\nIn the meantime, our review of the records has continued to develop. In addition to the tracheostomy and airway management issues, the documentation reflects significant pressure ulcers and circumstances under which Plaintiff was not permitted to visit her husband despite his deteriorating condition. These facts materially affect our evaluation of exposure.\n\nBefore either side incurs further motion and discovery expenses, I would welcome a discussion regarding a potential resolution. Please also confirm the available liability coverage for the relevant period, including any primary and excess layers, pursuant to CCP 2017.210.\n\nI look forward to your response.\n\nBest regards,\nVictoria Tulsidas, Esq.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4614873466', 'internal', 'email_log', 0, NULL, '2026-03-02 04:33:00.000', '2026-03-02 04:33:00.000', NULL, 'Meet and Confer Email to Bryan and Peter', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(54, 15, 1, 'admin', 'Spoke with Peter regarding MTS/Demurrer. We discussed possible policy limts but he did not disclose the deductible or policy limits. Advised we are open to settlement and intend to respond to the Motions he filed.\n\nAlso requested production of any documents he has in their possesion.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4620267631', 'internal', 'email_log', 0, NULL, '2026-03-04 07:07:00.000', '2026-03-04 07:07:00.000', NULL, 'Meet and Confer', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(55, 15, 1, 'admin', 'Texted client to advise her that I spoke to Opposing counsel and advised that the Plaintiff seeks 22 million for her husband\'s wrongful death.\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4620277591', 'internal', 'call_log', 0, NULL, '2026-03-04 07:08:00.000', '2026-03-04 07:08:00.000', NULL, 'Meet and Confer', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(56, 15, 1, 'admin', 'Sent request to Getem for Skip Tracing of the Corporate Entity\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4620281086', 'internal', 'email_log', 0, NULL, '2026-03-04 07:09:00.000', '2026-03-04 07:09:00.000', NULL, 'Skip Trace Request', NULL, NULL, 'Victoria Tulsidas, Esq.', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(63, 11, 1, 'admin', 'Dear Mr. Koonce,\n\nI hope you are well.\n\nI write regarding the DMG Wellness matter. After further discussion with our client, I have confirmed they are prepared to extend a $10,000 settlement offer to resolve this matter in its entirety.\n\nWhile our client continues to deny the allegations and maintains that the claims lack merit, this offer is being made in the interest of avoiding the time and expense associated with continued litigation. As you can appreciate, further proceedings will likely result in increased attorneys’ fees and costs on both sides, with no guarantee of a materially different outcome.\n\nAdditionally, without waiving any defenses, I believe it is important to be candid that our client has already sustained significant financial losses in connection with this underlying investment and is not in a position to meaningfully expand this offer. As such, this proposal reflects a practical effort to bring finality to the dispute rather than an assessment of liability.\n\nWe remain open to discussing a reasonable resolution and are hopeful that the parties can reach an agreement without the need for court intervention.\n\nPlease let me know your thoughts.\n\nBest regards,\n\n--- IMPORT METADATA ---\nOriginal Sender: Victoria Tulsidas, Esq.\nClio UniqueId: 4651817911', 'internal', 'email_log', 0, NULL, '2026-03-19 05:35:00.000', '2026-03-19 05:35:00.000', NULL, 'Counter Offer 10K', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0, 0, 0, NULL, NULL),
(70, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:34:19.742', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(71, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:34:45.825', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(72, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:35:10.151', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(73, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:35:35.002', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(74, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:36:00.010', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(75, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:36:25.022', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(76, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:37:23.163', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(77, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:37:44.172', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(78, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:38:43.822', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(79, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:39:44.171', '2026-07-17 09:55:52.992', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(80, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:40:43.954', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(81, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:41:43.812', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(82, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:42:43.829', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(83, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:43:43.834', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(84, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:44:43.849', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(85, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:48:43.906', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(86, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:49:43.898', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(87, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:50:43.913', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(88, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:51:43.923', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(89, NULL, 1, 'admin', '<br><br>jjjkkjbjk&nbsp;', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:52:32.524', '2026-07-17 10:53:18.313', NULL, 'kjh', '', '', 'a@gmial.com', NULL, 0, 0, 0, NULL, 0, NULL, 'msg-1784281952523', NULL, 'trash', NULL, 0, 1, 0, 1, 0, 1, NULL, 'synced'),
(90, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:52:43.937', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(91, NULL, 1, 'admin', '<br><br>jjjkkjbjk&nbsp;', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:52:58.989', '2026-07-17 09:55:30.055', NULL, 'kjh', '', '', 'a@gmial.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(92, NULL, 1, 'admin', '<br><br>jjjkkjbjk&nbsp;', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:53:23.990', '2026-07-17 10:53:18.313', NULL, 'kjh', '', '', 'a@gmial.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(93, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:53:43.964', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(94, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:54:22.140', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(95, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:54:44.948', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(96, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:55:09.976', '2026-07-17 09:58:22.142', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(97, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:55:44.267', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(98, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:56:44.402', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(99, NULL, 1, 'admin', 'dsfdfvdfvb<br><br>--- Original Message ---<br><br><br>jjjkkjbjk&nbsp;', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:56:44.056', '2026-07-17 10:53:18.313', NULL, 'j', '', '', 'f@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, 'msg-1784282204055', NULL, 'trash', NULL, 0, 1, 0, 1, 0, 1, NULL, 'synced'),
(100, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:57:19.907', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(101, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:57:40.260', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(102, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:58:05.388', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(103, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:58:44.384', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(104, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 09:59:44.429', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(105, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:00:09.809', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(106, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:00:34.936', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(107, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:00:59.593', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(108, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:01:24.574', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(109, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:01:49.584', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(110, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:02:14.587', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(111, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:02:39.593', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(112, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:03:04.596', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(113, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:03:29.602', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(114, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:03:54.845', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(115, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:04:19.607', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(116, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:04:45.088', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(117, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:05:10.078', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(118, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:05:35.100', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(119, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:05:59.634', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(120, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:06:24.631', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(121, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:06:49.629', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(122, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:07:14.642', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(123, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:07:39.640', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(124, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:12:14.692', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(125, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:12:40.807', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(126, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:13:05.196', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(127, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:13:30.180', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(128, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:14:33.242', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(129, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:15:34.200', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(130, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:16:00.201', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(131, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:16:25.205', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(132, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:16:50.215', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(133, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:17:15.218', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(134, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:17:44.240', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(135, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:18:44.245', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(136, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:19:44.253', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(137, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:20:44.832', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(138, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:21:44.728', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(139, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:22:44.669', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(140, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:23:44.622', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(141, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:24:44.695', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(142, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:25:45.245', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(143, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:26:45.365', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(144, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:27:44.603', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(145, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:28:44.733', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(146, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:29:44.746', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(147, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:30:44.416', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(148, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:31:44.477', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced');
INSERT INTO `communications` (`id`, `matter_id`, `sender_user_id`, `sender_role`, `message_body`, `visibility`, `communication_type`, `is_read`, `read_at`, `created_at`, `updated_at`, `parent_id`, `subject`, `bcc`, `cc`, `to`, `activity_id`, `request_read_receipt`, `track_opens`, `opened`, `opened_time`, `open_count`, `email_account_id`, `external_message_id`, `external_thread_id`, `folder`, `in_reply_to`, `is_archived`, `is_deleted`, `is_draft`, `is_flagged`, `is_spam`, `is_starred`, `references`, `sync_status`) VALUES
(149, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:32:44.412', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(150, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:33:44.417', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(151, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:34:44.429', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(152, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:35:44.450', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(153, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:36:44.585', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(154, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:37:44.498', '2026-07-17 10:53:40.663', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(155, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:38:44.468', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(156, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:39:44.471', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(157, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:40:44.488', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(158, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:41:44.512', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(159, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:42:44.615', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(160, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:43:44.531', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(161, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:44:44.529', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(162, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:45:44.543', '2026-07-17 10:53:18.313', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(163, NULL, 1, 'admin', '<br><br>lj;kkl', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:46:09.927', '2026-07-17 10:53:18.313', NULL, 'jlklk', '', '', 'ad@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, 'msg-1784285169926', NULL, 'trash', NULL, 0, 1, 0, 1, 0, 1, NULL, 'synced'),
(164, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:46:44.560', '2026-07-17 10:53:13.016', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 1, 0, 1, NULL, 'synced'),
(165, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:47:44.565', '2026-07-17 10:51:21.790', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'inbox', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(166, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:48:44.693', '2026-07-17 10:53:28.893', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(167, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:49:44.596', '2026-07-17 10:53:28.893', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(168, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:50:44.606', '2026-07-17 10:53:28.893', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(169, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:51:44.609', '2026-07-17 10:53:28.893', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(170, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:52:44.626', '2026-07-17 10:53:28.893', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(171, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:53:44.894', '2026-07-17 10:57:50.929', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(172, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:54:45.049', '2026-07-17 10:57:50.929', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(173, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:55:44.940', '2026-07-17 10:57:50.929', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(174, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:56:44.791', '2026-07-17 10:57:50.929', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(175, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:57:44.669', '2026-07-17 10:57:50.929', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'trash', NULL, 0, 1, 1, 0, 0, 0, NULL, 'synced'),
(176, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:58:44.683', '2026-07-17 10:58:44.683', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(177, NULL, 1, 'admin', '<br><br>hgbfhg', 'internal', 'titan_email', 1, '2026-07-17 11:01:10.192', '2026-07-17 10:58:53.956', '2026-07-17 11:01:10.193', NULL, 'fdhgv', '', '', 'a@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, 'msg-1784285933955-d2f5g60mc', NULL, 'sent', NULL, 0, 0, 0, 0, 0, 0, NULL, 'synced'),
(178, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 10:59:44.701', '2026-07-17 10:59:44.701', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(179, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 1, '2026-07-17 11:02:22.997', '2026-07-17 11:00:44.777', '2026-07-17 11:02:22.999', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(181, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 1, '2026-07-17 11:02:08.975', '2026-07-17 11:01:45.169', '2026-07-17 11:38:40.737', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'dgfd', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(182, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:02:45.007', '2026-07-17 11:02:45.007', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(183, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 1, '2026-07-17 11:04:31.953', '2026-07-17 11:03:45.150', '2026-07-17 11:05:38.286', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'hmgm', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(184, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:04:45.571', '2026-07-17 11:04:45.571', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(185, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:05:45.191', '2026-07-17 11:05:45.191', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(186, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:06:44.857', '2026-07-17 11:06:44.857', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(187, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:07:44.803', '2026-07-17 11:07:44.803', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(188, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:08:44.841', '2026-07-17 11:08:44.841', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(189, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:09:44.800', '2026-07-17 11:09:44.800', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(190, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:10:44.816', '2026-07-17 11:10:44.816', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(191, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:11:44.841', '2026-07-17 11:11:44.841', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(192, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:12:44.867', '2026-07-17 11:12:44.867', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(193, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:13:44.859', '2026-07-17 11:13:44.859', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(194, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:14:44.873', '2026-07-17 11:14:44.873', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(195, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:15:44.871', '2026-07-17 11:15:44.871', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(196, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:16:44.895', '2026-07-17 11:16:44.895', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(197, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:17:44.904', '2026-07-17 11:17:44.904', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(198, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:18:44.920', '2026-07-17 11:18:44.920', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(199, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:19:44.941', '2026-07-17 11:19:44.941', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(200, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:20:44.933', '2026-07-17 11:20:44.933', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(201, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:21:44.936', '2026-07-17 11:21:44.936', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(202, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:22:45.032', '2026-07-17 11:22:45.032', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(203, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:23:44.973', '2026-07-17 11:23:44.973', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(204, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:24:45.417', '2026-07-17 11:24:45.417', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced'),
(205, NULL, 1, 'admin', '<br><br><br>', 'internal', 'titan_email', 0, NULL, '2026-07-17 11:25:45.535', '2026-07-17 11:25:45.535', NULL, '', '', '', 'ba@gmail.com,kb@gmail.com', NULL, 0, 0, 0, NULL, 0, NULL, NULL, NULL, 'drafts', NULL, 0, 0, 1, 0, 0, 0, NULL, 'synced');

-- --------------------------------------------------------

--
-- Table structure for table `company_profile`
--

CREATE TABLE `company_profile` (
  `id` int NOT NULL,
  `company_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_url` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `letterhead_url` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_profile`
--

INSERT INTO `company_profile` (`id`, `company_name`, `address`, `phone`, `email`, `website`, `logo_url`, `letterhead_url`, `created_at`, `updated_at`) VALUES
(1, 'Victoria Tulsidas ', '750 San Vincente Blvd, Suite 800\nWest Hollywood, CA 90069', '1234567890', 'info@victoriatulsidaslaw.com', 'https://victoriatulsidaslaw.com', '/uploads/company/1783336593466-WhatsApp_Image_2026-04-13_at_11.01.36_AM-Photoroom-CIGkVcG_.png', NULL, '2026-06-23 07:55:16.699', '2026-07-06 11:24:16.194');

-- --------------------------------------------------------

--
-- Table structure for table `conflict_checks`
--

CREATE TABLE `conflict_checks` (
  `id` int NOT NULL,
  `prospective_client_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `opposing_party_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `result` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `matches` json DEFAULT NULL,
  `created_by_user_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `court_form_field_mappings`
--

CREATE TABLE `court_form_field_mappings` (
  `id` int NOT NULL,
  `template_id` int NOT NULL,
  `field_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `page_number` int NOT NULL,
  `x_position` double NOT NULL,
  `y_position` double NOT NULL,
  `font_size` double NOT NULL DEFAULT '10',
  `system_field_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `court_form_mappings`
--

CREATE TABLE `court_form_mappings` (
  `id` int NOT NULL,
  `template_id` int NOT NULL,
  `pdf_field_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `system_field_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `court_form_mappings`
--

INSERT INTO `court_form_mappings` (`id`, `template_id`, `pdf_field_name`, `system_field_path`, `created_at`) VALUES
(678, 42, 'Defendant', 'defendant', '2026-07-21 06:26:31.396'),
(679, 42, 'Plaintiff', 'plaintiff', '2026-07-21 06:26:31.396'),
(680, 42, 'Judge\'s_signature', 'judge_name', '2026-07-21 06:26:31.396'),
(681, 42, 'Judge_Date', 'judge_name', '2026-07-21 06:26:31.396'),
(682, 42, 'Judge_Name3', 'judge_name', '2026-07-21 06:26:31.396'),
(683, 43, 'CIV-110[0].Page1[0].p1Caption[0].CaptionSub[0].CaseNumber[0].CaseNumber[0]', 'case_number', '2026-07-23 13:54:21.892'),
(684, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].AttyBarNo[0]', 'Atty Bar No', '2026-07-23 13:54:21.892'),
(685, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].Name[0]', 'attorney_name', '2026-07-23 13:54:21.892'),
(686, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].AttyFirm[0]', 'firm_name', '2026-07-23 13:54:21.892'),
(687, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].Street[0]', 'firm_address', '2026-07-23 13:54:21.892'),
(688, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].City[0]', 'firm_city', '2026-07-23 13:54:21.892'),
(689, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].State[0]', 'firm_state', '2026-07-23 13:54:21.892'),
(690, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].Zip[0]', 'firm_zip', '2026-07-23 13:54:21.892'),
(691, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].Phone[0]', 'firm_phone', '2026-07-23 13:54:21.892'),
(692, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].Email[0]', 'attorney_email', '2026-07-23 13:54:21.892'),
(693, 43, 'CIV-110[0].Page1[0].p1Caption[0].AttyPartyInfo[0].AttyFor[0]', 'client_name', '2026-07-23 13:54:21.892'),
(694, 43, 'CIV-110[0].Page1[0].Item7[0].li7b[0].petitioner_cb[0]', 'plaintiff', '2026-07-23 13:54:21.892'),
(695, 43, 'CIV-110[0].Page1[0].Item7[0].li7b[0].petitioner_cb[1]', 'plaintiff', '2026-07-23 13:54:21.892'),
(696, 43, 'CIV-110[0].Page2[0].PxCaption[0].CaseNumber[0].CaseNumber[0]', 'case_number', '2026-07-23 13:54:21.892'),
(697, 44, 'SUBP-010[0].Page1[0].P1Caption[0].CaseNumber[0].CaseNumber[0]', 'case_number', '2026-07-23 13:54:39.235'),
(698, 44, 'SUBP-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Phone[0]', 'firm_phone', '2026-07-23 13:54:39.235'),
(699, 44, 'SUBP-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Email[0]', 'attorney_email', '2026-07-23 13:54:39.235'),
(700, 44, 'SUBP-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Name[0]', 'attorney_name', '2026-07-23 13:54:39.235'),
(701, 44, 'SUBP-010[0].Page1[0].List1[0].Item[0].HearingDate_dt[0]', 'hearing_date', '2026-07-23 13:54:39.235'),
(702, 44, 'SUBP-010[0].Page1[0].List1[0].Item[0].HearingDept_ft[0]', 'judge_name', '2026-07-23 13:54:39.235'),
(703, 44, 'SUBP-010[0].Page2[0].PxCaption[0].CaseNumber[0].CaseNumber[0]', 'case_number', '2026-07-23 13:54:39.235'),
(704, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].AttyBarNo[0]', 'Atty Bar No', '2026-07-23 13:54:53.446'),
(705, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Name[0]', 'attorney_name', '2026-07-23 13:54:53.446'),
(706, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].AttyFirm[0]', 'firm_name', '2026-07-23 13:54:53.446'),
(707, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Street[0]', 'firm_address', '2026-07-23 13:54:53.446'),
(708, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].City[0]', 'firm_city', '2026-07-23 13:54:53.446'),
(709, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].State[0]', 'firm_state', '2026-07-23 13:54:53.446'),
(710, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Zip[0]', 'firm_zip', '2026-07-23 13:54:53.446'),
(711, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Phone[0]', 'firm_phone', '2026-07-23 13:54:53.446'),
(712, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Email[0]', 'attorney_email', '2026-07-23 13:54:53.446'),
(713, 45, 'CM-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].AttyFor[0]', 'client_name', '2026-07-23 13:54:53.446'),
(714, 45, 'CM-010[0].Page1[0].P1Caption[0].csn[0].CaseNumber[0]', 'case_number', '2026-07-23 13:54:53.446'),
(715, 45, 'CM-010[0].Page1[0].P1Caption[0].HearingInfo[0].HearingDate[0]', 'hearing_date', '2026-07-23 13:54:53.446'),
(716, 45, 'CM-010[0].Page1[0].P1Caption[0].HearingInfo[0].HearingDept[0]', 'judge_name', '2026-07-23 13:54:53.446'),
(717, 46, 'POS-010[0].Page1[0].P1Caption[0].CaseNumber1[0].CaseNumber[0]', 'case_number', '2026-07-23 13:55:08.768'),
(718, 46, 'POS-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Phone[0]', 'firm_phone', '2026-07-23 13:55:08.768'),
(719, 46, 'POS-010[0].Page1[0].P1Caption[0].AttyPartyInfo[0].Email[0]', 'attorney_email', '2026-07-23 13:55:08.768'),
(720, 46, 'POS-010[0].Page1[0].P1Caption[0].CaseNumber2[0].reqNumber[0]', 'case_number', '2026-07-23 13:55:08.768'),
(721, 46, 'POS-010[0].Page2[0].PxCaption[0].CaseNumber[0].CaseNumber[0]', 'case_number', '2026-07-23 13:55:08.768'),
(722, 47, 'FW-001[0].Page1[0].RightCaption[0].CaseNumber[0]', 'case_number', '2026-07-23 13:55:27.175'),
(723, 47, 'FW-001[0].Page1[0].RightCaption[0].CaseName[0]', 'case_title', '2026-07-23 13:55:27.175'),
(724, 47, 'FW-001[0].Page1[0].List1[0].item1[0].PetitionerName1[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(725, 47, 'FW-001[0].Page1[0].List1[0].item1[0].PetitionerStrAddress[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(726, 47, 'FW-001[0].Page1[0].List1[0].item1[0].PetitionerCity[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(727, 47, 'FW-001[0].Page1[0].List1[0].item1[0].PetitionerState[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(728, 47, 'FW-001[0].Page1[0].List1[0].item1[0].PetitionerZip[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(729, 47, 'FW-001[0].Page1[0].List1[0].item1[0].PetitionerTel[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(730, 47, 'FW-001[0].Page1[0].List2[0].item2[0].PetitionerJobTitle[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(731, 47, 'FW-001[0].Page1[0].List2[0].item2[0].PetitionerEmployerName[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(732, 47, 'FW-001[0].Page1[0].List2[0].item2[0].PetitionerEmployerAdd[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(733, 47, 'FW-001[0].Page1[0].List3[0].PetitionerLawyerInfo[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(734, 47, 'FW-001[0].Page1[0].Sign[0].PetitionerName[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(735, 47, 'FW-001[0].Page2[0].pXCaption[0].PetitionerName1[0]', 'plaintiff', '2026-07-23 13:55:27.175'),
(736, 47, 'FW-001[0].Page2[0].pXCaption[0].CaseNumber[0]', 'case_number', '2026-07-23 13:55:27.175');

-- --------------------------------------------------------

--
-- Table structure for table `court_form_templates`
--

CREATE TABLE `court_form_templates` (
  `id` int NOT NULL,
  `form_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `practice_area` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pdf_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `court_form_templates`
--

INSERT INTO `court_form_templates` (`id`, `form_number`, `title`, `practice_area`, `pdf_path`, `is_active`, `created_at`) VALUES
(42, 'AO-085', 'AO-085', 'Civil Litigation', 'uploads\\templates\\AO-085_1784615187716.pdf', 1, '2026-07-21 06:26:28.674'),
(43, 'CIV-110', 'CIV-110', 'Civil Litigation', 'uploads/templates/CIV-110_1784814861712.pdf', 1, '2026-07-23 13:54:21.872'),
(44, 'SUBP-010', 'SUBP-010', 'Civil Litigation', 'uploads/templates/SUBP-010_1784814879154.pdf', 1, '2026-07-23 13:54:39.217'),
(45, 'CM-010', 'CM-010', 'Civil Litigation', 'uploads/templates/CM-010_1784814893336.pdf', 1, '2026-07-23 13:54:53.432'),
(46, 'POS-010', 'POS-010', 'Civil Litigation', 'uploads/templates/POS-010_1784814908657.pdf', 1, '2026-07-23 13:55:08.747'),
(47, 'FW-001', 'FW-001', 'General Practice', 'uploads/templates/FW-001_1784814927066.pdf', 1, '2026-07-23 13:55:27.159');

-- --------------------------------------------------------

--
-- Table structure for table `custom_field_definitions`
--

CREATE TABLE `custom_field_definitions` (
  `id` int NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `custom_field_definitions`
--

INSERT INTO `custom_field_definitions` (`id`, `name`, `type`, `options`, `is_active`, `created_at`, `updated_at`) VALUES
(3, 'Court Jurisdiction', 'text', NULL, 1, '2026-06-20 10:37:30.225', '2026-06-20 10:37:30.225');

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int NOT NULL,
  `matter_id` int NOT NULL,
  `uploaded_by_user_id` int NOT NULL,
  `file_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `visibility` enum('internal','client_shared','client_visible') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'internal',
  `category` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_signature_required` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `folder_id` int DEFAULT NULL,
  `folder_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`id`, `matter_id`, `uploaded_by_user_id`, `file_name`, `original_name`, `mime_type`, `file_path`, `file_size`, `visibility`, `category`, `is_signature_required`, `created_at`, `updated_at`, `folder_id`, `folder_path`) VALUES
(162, 22, 1, '1784878566610-report-1.pdf', 'report-1.pdf', 'application/pdf', '/app/uploads/documents/1784878566610-report-1.pdf', 2760, 'internal', 'Court order', 0, '2026-07-24 07:36:06.654', '2026-07-24 07:36:06.654', NULL, NULL),
(163, 22, 1, '1785220553801-Untitled_document__4_.pdf', 'Untitled document (4).pdf', 'application/pdf', 'I:\\legal-case-management-final\\legal-case-management-backend\\uploads\\documents\\1785220553801-Untitled_document__4_.pdf', 495151, 'client_shared', 'Email Attachment', 0, '2026-07-28 06:35:54.697', '2026-07-28 06:35:54.697', NULL, NULL),
(164, 22, 1, '1785220591073-Untitled_document__4_.pdf', 'Untitled document (4).pdf', 'application/pdf', 'I:\\legal-case-management-final\\legal-case-management-backend\\uploads\\documents\\1785220591073-Untitled_document__4_.pdf', 495151, 'client_shared', 'Email Attachment', 0, '2026-07-28 06:36:32.003', '2026-07-28 06:36:32.003', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `document_categories`
--

CREATE TABLE `document_categories` (
  `id` int NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `document_categories`
--

INSERT INTO `document_categories` (`id`, `name`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Pleadings', 1, '2026-06-22 05:43:05.419', '2026-06-22 05:43:05.419'),
(2, 'Motions', 1, '2026-06-22 05:43:05.447', '2026-06-22 05:43:05.447'),
(3, 'Discovery', 1, '2026-06-22 05:43:05.451', '2026-06-22 05:43:05.451'),
(4, 'Medical Records', 1, '2026-06-22 05:43:05.455', '2026-06-22 05:43:05.455'),
(5, 'Evidence', 1, '2026-06-22 05:43:05.461', '2026-06-22 05:43:05.461'),
(6, 'Contracts', 1, '2026-06-22 05:43:05.464', '2026-06-22 05:43:05.464'),
(7, 'Invoices', 1, '2026-06-22 05:43:05.467', '2026-06-22 05:43:05.467'),
(8, 'Correspondence', 1, '2026-06-22 05:43:05.471', '2026-06-22 05:43:05.471'),
(9, 'Other', 1, '2026-06-22 05:43:05.474', '2026-06-22 05:43:05.474');

-- --------------------------------------------------------

--
-- Table structure for table `drafts`
--

CREATE TABLE `drafts` (
  `id` int NOT NULL,
  `matter_id` int NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('draft','ready','sent_for_signature','signed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by_user_id` int NOT NULL,
  `last_updated_by_user_id` int DEFAULT NULL,
  `sent_for_signature_at` datetime(3) DEFAULT NULL,
  `signed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `signed_document_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_accounts`
--

CREATE TABLE `email_accounts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `provider` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `smtp_host` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_port` int DEFAULT NULL,
  `imap_host` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imap_port` int DEFAULT NULL,
  `username` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `access_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `refresh_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sync_status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_sync_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_accounts`
--

INSERT INTO `email_accounts` (`id`, `user_id`, `provider`, `email_address`, `smtp_host`, `smtp_port`, `imap_host`, `imap_port`, `username`, `password`, `access_token`, `refresh_token`, `sync_status`, `last_sync_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'titan', 'demogmail01@gmail.com', 'smtp.titan.email', 465, 'imap.titan.email', 993, 'demogmail01@gmail.com', '12245', NULL, NULL, 'connected', NULL, '2026-07-17 12:26:19.634', '2026-07-17 12:26:19.634'),
(2, 1, 'titan', 'a@vktori.com', 'smtp.titan.email', 465, 'imap.titan.email', 993, 'a@vktori.com', '1234', NULL, NULL, 'connected', NULL, '2026-07-17 12:30:38.734', '2026-07-17 12:30:38.734'),
(3, 1, 'titan', 'admin@vktori.com', 'smtp.titan.email', 465, 'imap.titan.email', 993, 'admin@vktori.com', '1234', NULL, NULL, 'connected', NULL, '2026-07-24 06:40:59.162', '2026-07-24 06:40:59.162'),
(4, 1, 'titan', 'admin@vktori.com', 'smtp.titan.email', 465, 'imap.titan.email', 993, 'admin@vktori.com', '1234', NULL, NULL, 'connected', NULL, '2026-07-24 06:41:33.853', '2026-07-24 06:41:33.853'),
(5, 1, 'titan', 'abc@gmail.com', 'smtp.titan.email', 465, 'imap.titan.email', 993, 'abc@gmail.com', 'admin123', NULL, NULL, 'connected', NULL, '2026-07-24 06:42:26.717', '2026-07-24 06:42:26.717');

-- --------------------------------------------------------

--
-- Table structure for table `event_attendees`
--

CREATE TABLE `event_attendees` (
  `id` int NOT NULL,
  `event_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `is_optional` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_attendees`
--

INSERT INTO `event_attendees` (`id`, `event_id`, `user_id`, `email`, `status`, `created_at`, `is_optional`) VALUES
(18, 16, 3, NULL, 'pending', '2026-07-14 12:36:48.782', 0),
(19, 16, 3, NULL, 'pending', '2026-07-14 12:36:48.782', 1),
(20, 16, NULL, 'test', 'pending', '2026-07-14 12:36:48.782', 0),
(21, 16, NULL, 'purpose', 'pending', '2026-07-14 12:36:48.782', 1);

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int NOT NULL,
  `vendor` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `matter_id` int DEFAULT NULL,
  `category` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'General',
  `amount` double NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `vendor`, `matter_id`, `category`, `amount`, `date`, `status`, `description`, `created_by_id`, `created_at`, `updated_at`) VALUES
(1, '12', 20, 'Court Filing Fees', 20, '2026-07-24 00:00:00.000', 'approved', 'err', 1, '2026-07-24 05:47:22.233', '2026-07-24 05:47:22.233');

-- --------------------------------------------------------

--
-- Table structure for table `folders`
--

CREATE TABLE `folders` (
  `id` int NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `matter_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `folders`
--

INSERT INTO `folders` (`id`, `name`, `matter_id`, `created_at`) VALUES
(1, 'testFolder', NULL, '2026-07-25 07:36:55.824');

-- --------------------------------------------------------

--
-- Table structure for table `generated_forms`
--

CREATE TABLE `generated_forms` (
  `id` int NOT NULL,
  `template_id` int NOT NULL,
  `matter_id` int NOT NULL,
  `form_data` json NOT NULL,
  `pdf_file_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_by` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `generated_forms`
--

INSERT INTO `generated_forms` (`id`, `template_id`, `matter_id`, `form_data`, `pdf_file_name`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
(142, 45, 8, '{\"firm_zip\": \"90069\", \"defendant\": \"\", \"firm_city\": \"West Hollywood\", \"firm_name\": \"Victoria Tulsidas Law, A Professional Legal Corporation\", \"plaintiff\": \"Kathy McMillan-Blake\", \"case_title\": \"Limited Scope Representation Wrongful Death in Care Facility\", \"court_name\": \"\", \"firm_email\": \"vtulsidas@victoriatulsidaslaw.com\", \"firm_phone\": \"(310) 504-2359\", \"firm_state\": \"CA\", \"judge_name\": \"\", \"Atty Bar No\": \"365147\", \"case_number\": \"4545\", \"client_name\": \"Kathy McMillan-Blake\", \"filing_date\": \"2026-07-24\", \"client_email\": \"kathymcmillanblake@placeholder.local\", \"client_phone\": \"35465564\", \"firm_address\": \"750 San Vincente Blvd, Suite 800 West\", \"hearing_date\": \"\", \"attorney_name\": \"Victoria Tulsidas, Esq.\", \"court_address\": \"\", \"matter_number\": \"00003-McMillan-Blake\", \"attorney_email\": \"vtulsidas@victoriatulsidaslaw.com\", \"client_address\": \"vzcv\", \"hearing_location\": \"\"}', 'CM-010_matter-8_1784870352774.pdf', 'filed', 1, '2026-07-24 05:19:11.833', '2026-07-24 06:52:40.781'),
(143, 42, 17, '{\"firm_zip\": \"90069\", \"defendant\": \"\", \"firm_city\": \"West Hollywood\", \"firm_name\": \"Victoria Tulsidas Law, A Professional Legal Corporation\", \"plaintiff\": \"Lovelace Abdullah\", \"case_title\": \"Hi\", \"court_name\": \"New Dilth\", \"firm_email\": \"vtulsidas@victoriatulsidaslaw.com\", \"firm_phone\": \"(310) 504-2359\", \"firm_state\": \"CA\", \"judge_name\": \"Mi\", \"Atty Bar No\": \"365147\", \"case_number\": \"55\", \"client_name\": \"Lovelace Abdullah\", \"filing_date\": \"2026-07-25\", \"client_email\": \"lovelaceabdullah@placeholder.local\", \"client_phone\": \"\", \"firm_address\": \"750 San Vincente Blvd, Suite 800 West\", \"hearing_date\": \"2026-08-22\", \"attorney_name\": \"Victoria Tulsidas, Esq.\", \"court_address\": \"pune\", \"matter_number\": \"00012-Buck\", \"attorney_email\": \"vtulsidas@victoriatulsidaslaw.com\", \"client_address\": \"\", \"hearing_location\": \"\"}', 'AO-085_matter-17_1784877348153.pdf', 'filed', 1, '2026-07-24 07:15:47.297', '2026-07-24 08:47:04.538');

-- --------------------------------------------------------

--
-- Table structure for table `generic_activities`
--

CREATE TABLE `generic_activities` (
  `id` int NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Open',
  `created_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int NOT NULL,
  `matter_id` int NOT NULL,
  `invoice_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `amount` decimal(10,2) NOT NULL,
  `due_date` datetime(3) DEFAULT NULL,
  `status` enum('draft','unpaid','due','paid','overdue','void') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `issued_at` datetime(3) DEFAULT NULL,
  `paid_at` datetime(3) DEFAULT NULL,
  `created_by_user_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `email_error` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email_status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_link` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pdf_document_id` int DEFAULT NULL,
  `sent_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `matter_id`, `invoice_number`, `description`, `amount`, `due_date`, `status`, `issued_at`, `paid_at`, `created_by_user_id`, `created_at`, `updated_at`, `email_error`, `email_status`, `payment_link`, `pdf_document_id`, `sent_at`) VALUES
(7, 20, 'INV-2026-0001', 'Consolidated billing for matter 20', 70.00, '2026-07-16 07:26:33.206', 'draft', NULL, NULL, 1, '2026-07-11 07:26:33.207', '2026-07-24 06:11:04.824', NULL, NULL, NULL, NULL, NULL),
(11, 8, 'INV-2026-0005', 'Consolidated billing for matter 8', 20.00, '2026-07-22 21:23:45.665', 'draft', NULL, NULL, 1, '2026-07-17 21:23:45.667', '2026-07-17 21:23:47.687', NULL, NULL, NULL, NULL, NULL),
(13, 15, 'INV-2026-0004', 'Consolidated billing for matter 15', 10.00, '2026-07-28 22:05:15.291', 'draft', NULL, NULL, 1, '2026-07-23 22:05:15.292', '2026-07-23 22:05:15.332', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoice_items`
--

INSERT INTO `invoice_items` (`id`, `invoice_id`, `description`, `amount`, `created_at`) VALUES
(81, 7, 'Legal Services: 0.1 hrs', 10.00, '2026-07-11 07:26:33.212'),
(82, 7, 'Legal Services: 0.1 hrs', 10.00, '2026-07-11 09:31:38.898'),
(86, 7, 'Legal Services: 0.1 hrs', 10.00, '2026-07-11 10:00:42.671'),
(93, 7, 'Legal Services: 0.1 hrs', 10.00, '2026-07-17 20:29:57.400'),
(94, 11, 'Legal Services: 0.2 hrs', 20.00, '2026-07-17 21:23:46.676'),
(98, 13, 'Legal Services: 0.1 hrs', 10.00, '2026-07-23 22:05:15.312'),
(99, 7, 'Legal Services: 0.1 hrs', 10.00, '2026-07-24 05:56:24.141'),
(100, 7, 'Legal Services: 0.1 hrs', 10.00, '2026-07-24 06:05:21.084'),
(101, 7, 'Legal Services: 0.1 hrs', 10.00, '2026-07-24 06:11:04.802');

-- --------------------------------------------------------

--
-- Table structure for table `lawyers`
--

CREATE TABLE `lawyers` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `display_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `practice_focus` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lawyers`
--

INSERT INTO `lawyers` (`id`, `user_id`, `display_name`, `practice_focus`, `phone`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 1, 'Victoria Admin', NULL, NULL, 1, '2026-06-24 09:30:07.974', '2026-07-24 06:39:01.038'),
(4, 9, 'lawyer john', NULL, NULL, 1, '2026-07-24 07:24:01.043', '2026-07-24 07:24:01.043');

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int NOT NULL,
  `full_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `matter_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `practice_area` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('new','screening','referred','consultation_set','retained','declined','archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by_user_id` int DEFAULT NULL,
  `converted_client_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `full_name`, `email`, `phone`, `matter_type`, `practice_area`, `source`, `message`, `status`, `notes`, `created_by_user_id`, `converted_client_id`, `created_at`, `updated_at`) VALUES
(2, 'Sample Lead', 'lead@example.com', '123-456-7890', 'Divorce', 'Family Law', 'Google', 'I need legal advice regarding my divorce.', 'retained', '', NULL, 22, '2026-07-16 10:08:25.373', '2026-07-17 09:16:29.947'),
(3, 'rygdc', 'admin@society.com', '123548526', 'Creative Law', 'Creative Law', 'website', 'khgvsdljdsf;kvfkldbb d.gwer.gjkl9p[ughkjlcvw5u', 'new', 'Channel: website book consultation\nPreferred consultation date: 2026-07-17', NULL, NULL, '2026-07-17 09:28:04.159', '2026-07-17 09:28:04.159'),
(4, 'Client First', 'client@gmail.com', '0000000000', 'Unlawful Detainer', 'Unlawful Detainer', 'Ya Searchable Dropdown agar bahut saare options hain.', NULL, 'new', 'First of the Markety', 1, NULL, '2026-07-24 06:09:41.162', '2026-07-24 06:09:41.162');

-- --------------------------------------------------------

--
-- Table structure for table `matters`
--

CREATE TABLE `matters` (
  `id` int NOT NULL,
  `matter_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_id` int NOT NULL,
  `assigned_lawyer_id` int DEFAULT NULL,
  `practice_area` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `matter_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `opposing_party_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','active','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `opened_at` datetime(3) DEFAULT NULL,
  `closed_at` datetime(3) DEFAULT NULL,
  `created_by_user_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `next_hearing` datetime(3) DEFAULT NULL,
  `case_number` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `court_address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `court_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_loss` datetime(3) DEFAULT NULL,
  `initial_filing_date` datetime(3) DEFAULT NULL,
  `judge_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `trial_date` datetime(3) DEFAULT NULL,
  `parties_data` json DEFAULT NULL,
  `vehicles_data` json DEFAULT NULL,
  `intake_answers` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `matters`
--

INSERT INTO `matters` (`id`, `matter_number`, `title`, `client_id`, `assigned_lawyer_id`, `practice_area`, `matter_type`, `opposing_party_name`, `description`, `status`, `opened_at`, `closed_at`, `created_by_user_id`, `created_at`, `updated_at`, `next_hearing`, `case_number`, `court_address`, `court_name`, `date_of_loss`, `initial_filing_date`, `judge_name`, `priority`, `trial_date`, `parties_data`, `vehicles_data`, `intake_answers`) VALUES
(8, '00003-McMillan-Blake', 'Limited Scope Representation Wrongful Death in Care Facility', 10, NULL, 'Uncategorized', 'General', NULL, NULL, 'active', '2026-01-12 18:30:00.000', NULL, 1, '2026-01-13 22:01:28.000', '2026-01-13 22:40:44.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'medium', NULL, NULL, NULL, NULL),
(11, '00006-DMG Wellness', 'Breach of Commerical Lease Agreement', 13, NULL, 'Uncategorized', 'General', NULL, NULL, 'active', '2026-01-22 18:30:00.000', NULL, 1, '2026-01-23 18:17:45.000', '2026-01-23 18:17:45.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'medium', NULL, NULL, NULL, NULL),
(12, '00007-Sesay', 'Property Damage Claim', 14, NULL, 'Civil Litigation', 'General', NULL, NULL, 'active', '2025-12-18 18:30:00.000', NULL, 1, '2026-01-29 22:10:06.000', '2026-01-29 22:41:56.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'medium', NULL, NULL, NULL, NULL),
(13, '00008-Daramy', 'Racial Discrimination in Private Business', 15, NULL, 'Civil Rights / Constitutional', 'General', NULL, NULL, 'active', '2026-01-29 18:30:00.000', NULL, 1, '2026-01-30 17:24:42.000', '2026-01-30 18:16:57.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'medium', NULL, NULL, NULL, NULL),
(14, '00009-Wilson', 'Workplace Violence and Abuse Claim', 16, NULL, 'Civil Litigation', 'General', NULL, NULL, 'active', '2026-01-29 18:30:00.000', NULL, 1, '2026-01-31 00:46:55.000', '2026-02-24 19:54:24.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'medium', NULL, NULL, NULL, NULL),
(15, '00010-Jones', 'Dental Malpractice/Negligence Wrongful Death', 17, NULL, 'Civil Litigation', 'General', NULL, NULL, 'active', '2026-02-01 18:30:00.000', NULL, 1, '2026-02-02 20:11:24.000', '2026-02-02 20:11:24.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'medium', NULL, NULL, NULL, NULL),
(17, '00012-Buck', 'Wronful Termination Mediation', 18, NULL, 'Uncategorized', 'General', NULL, NULL, 'active', '2026-02-07 18:30:00.000', NULL, 1, '2026-02-11 22:04:02.000', '2026-02-12 01:54:07.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'medium', NULL, NULL, NULL, NULL),
(20, '00015-Kallay', 'Client travelling in the No2 lane N/B on Prariie towards 147th street when he was struck on the right side by driver No 2', 20, NULL, 'Uncategorized', 'General', NULL, NULL, 'active', '2026-03-05 18:30:00.000', NULL, 1, '2026-03-07 06:09:32.000', '2026-03-07 06:09:32.000', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'medium', NULL, NULL, NULL, NULL),
(22, 'MT-00009', 'VkTori', 1, 9, 'Immigration', 'Immigration', 'Witness', 'This case involves a property ownership dispute between the plaintiff and the defendant regarding the ownership and possession of residential property located at 123 Main Street.', 'pending', '2026-07-24 00:00:00.000', NULL, 1, '2026-07-24 06:01:05.435', '2026-07-24 07:59:04.160', NULL, '452', 'Indore', 'Delhi High Court', '2026-07-25 00:00:00.000', '2026-07-25 00:00:00.000', 'Neha Ji', 'high', '2026-07-24 00:00:00.000', NULL, NULL, NULL),
(23, 'MT-00010', 'wert', 12, 1, 'Civil Litigation', 'Civil Litigation', NULL, NULL, 'pending', NULL, NULL, 1, '2026-07-24 07:54:06.956', '2026-07-24 07:54:06.956', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'High', NULL, NULL, NULL, NULL),
(24, 'MT-00011', 'test', 25, 9, 'Civil Rights / Constitutional', 'Civil Rights / Constitutional', NULL, NULL, 'pending', NULL, NULL, 9, '2026-07-24 07:57:34.499', '2026-07-24 07:57:34.499', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'High', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `matter_custom_field_values`
--

CREATE TABLE `matter_custom_field_values` (
  `id` int NOT NULL,
  `matter_id` int NOT NULL,
  `field_definition_id` int NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `matter_custom_field_values`
--

INSERT INTO `matter_custom_field_values` (`id`, `matter_id`, `field_definition_id`, `value`, `created_at`, `updated_at`) VALUES
(37, 22, 3, 'High Court', '2026-07-24 06:01:05.620', '2026-07-24 07:59:05.195'),
(38, 23, 3, '', '2026-07-24 07:54:07.018', '2026-07-24 07:54:07.018'),
(39, 24, 3, '', '2026-07-24 07:57:36.543', '2026-07-24 07:57:36.543');

-- --------------------------------------------------------

--
-- Table structure for table `matter_status_history`
--

CREATE TABLE `matter_status_history` (
  `id` int NOT NULL,
  `matter_id` int NOT NULL,
  `old_status` enum('pending','active','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_status` enum('pending','active','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_user_id` int NOT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `reference_id`, `is_read`, `created_at`) VALUES
(59, 3, 'Calendar Invitation: hearing', 'You have been invited to an event scheduled for 7/14/2026.', 'system', 16, 0, '2026-07-14 07:50:34.479'),
(60, 3, 'Calendar Invitation: hearing', 'You have been invited to an event scheduled for 7/14/2026.', 'system', 16, 0, '2026-07-14 07:50:34.482'),
(61, 3, 'Calendar Invitation: ;lk', 'You have been invited to an event scheduled for 7/15/2026.', 'system', 19, 0, '2026-07-15 10:16:39.740'),
(66, 3, 'New Document Uploaded', 'A new document \"Invoice-INV-2026-0004.pdf\" has been added to matter MAT-2026-001.', 'document', 21, 0, '2026-07-18 13:13:11.507'),
(70, 3, 'New Document Uploaded', 'A new document \"report-1.pdf\" has been added to matter MT-00009.', 'document', 22, 0, '2026-07-24 07:36:08.692'),
(71, 9, 'New Message Received', 'Sarah mitchell sent you a message regarding matter MT-00009.', 'system', 22, 0, '2026-07-24 09:01:16.094'),
(72, 9, 'New Message Received', 'Sarah mitchell sent you a message regarding matter MT-00009.', 'system', 22, 0, '2026-07-24 09:01:17.598'),
(73, 9, 'New Message Received', 'Sourabh sent you a message regarding matter MT-00011.', 'system', 24, 0, '2026-07-24 09:06:05.132'),
(74, 3, 'New Message Received', 'lawyer john sent you a message regarding matter MT-00009.', 'system', 22, 0, '2026-07-25 05:36:24.246'),
(75, 3, 'New Document Uploaded', 'A new document \"Untitled document (4).pdf\" has been added to matter MT-00009.', 'document', 22, 0, '2026-07-28 06:36:01.751'),
(76, 3, 'New Document Uploaded', 'A new document \"Untitled document (4).pdf\" has been added to matter MT-00009.', 'document', 22, 0, '2026-07-28 06:36:39.238');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `matter_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_reference` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid_on` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by_user_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `practice_areas`
--

CREATE TABLE `practice_areas` (
  `id` int NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `practice_areas`
--

INSERT INTO `practice_areas` (`id`, `name`, `is_active`, `created_at`, `updated_at`) VALUES
(9, 'Personal Injury', 1, '2026-07-06 09:11:38.602', '2026-07-06 09:11:38.602'),
(10, 'Immigration', 1, '2026-07-06 09:11:38.619', '2026-07-06 09:11:38.619'),
(11, 'Property Damage', 1, '2026-07-06 09:11:38.625', '2026-07-06 09:11:38.625'),
(12, 'Unlawful Detainer', 1, '2026-07-06 09:11:38.629', '2026-07-06 09:11:38.629'),
(13, 'Employment', 1, '2026-07-06 09:11:38.635', '2026-07-06 09:11:38.635'),
(15, 'Wrongful Death', 1, '2026-07-06 09:11:38.647', '2026-07-06 09:11:38.647'),
(16, 'Medical Malpractice', 1, '2026-07-06 09:11:38.653', '2026-07-06 09:11:38.653'),
(17, 'Contracts', 1, '2026-07-06 09:11:38.659', '2026-07-06 09:11:38.659'),
(18, 'Civil Rights', 1, '2026-07-06 09:11:38.664', '2026-07-06 09:11:38.664'),
(19, 'Civil Litigation', 1, '2026-07-11 07:20:59.974', '2026-07-11 07:20:59.974'),
(20, 'Civil Rights / Constitutional', 1, '2026-07-11 07:20:59.983', '2026-07-11 07:20:59.983'),
(21, 'Worker\'s Compensation', 1, '2026-07-11 07:21:00.021', '2026-07-11 07:21:00.021'),
(22, 'Family Law', 1, '2026-07-16 10:08:25.443', '2026-07-16 10:08:25.443'),
(23, 'Criminal Defense', 1, '2026-07-16 10:08:25.453', '2026-07-16 10:08:25.453'),
(24, 'Corporate Law', 1, '2026-07-16 10:08:25.464', '2026-07-16 10:08:25.464'),
(25, 'Real Estate', 1, '2026-07-16 10:08:25.483', '2026-07-16 10:08:25.483'),
(26, 'Employment Law', 1, '2026-07-16 10:08:25.492', '2026-07-16 10:08:25.492'),
(27, 'Intellectual Property', 1, '2026-07-16 10:08:25.505', '2026-07-16 10:08:25.505');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_date` datetime(3) NOT NULL,
  `end_date` datetime(3) NOT NULL,
  `data` json NOT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `title`, `category`, `start_date`, `end_date`, `data`, `created_by`, `created_at`) VALUES
(1, ' Quarterly Tax Summary', 'Operational', '2026-07-25 00:00:00.000', '2026-07-25 00:00:00.000', '{\"hours\": 0, \"leads\": 0, \"matters\": 0, \"revenue\": 0}', 1, '2026-07-24 07:09:17.524');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int NOT NULL,
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `key`, `value`, `updated_at`) VALUES
(1, 'firm_name', 'VkTori Legal', '2026-07-06 11:24:16.191'),
(2, 'specialty', 'Civil & Corporate Litigation', '2026-07-06 11:24:16.196'),
(3, 'email', 'info@victoriatulsidaslaw.com', '2026-07-06 11:24:16.200'),
(4, 'phone', '147852411', '2026-07-06 11:24:16.203'),
(5, 'billing_rate', '100', '2026-07-06 11:24:16.205'),
(6, 'auto_invoice', 'true', '2026-07-06 11:24:16.207'),
(7, 'notify_new_lead', 'true', '2026-07-06 11:24:16.209'),
(8, 'notify_direct_message', 'true', '2026-07-06 11:24:16.211'),
(9, 'notify_matter_deadlines', 'true', '2026-07-06 11:24:16.213'),
(10, 'notify_task_assignments', 'true', '2026-07-06 11:24:16.216'),
(11, 'firm_logo_base64', 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxISEhUSEBIVFRUVFRcYFhUWFRUVFhgXFRUWFhUYGBcYHSggGRolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGi0lICUtLSstKy0tLS0tLi0tLS0tLS0tLS0t', '2026-07-06 11:24:16.218'),
(12, 'firm_logo_name', 'images.jpg', '2026-07-06 11:24:16.219');

-- --------------------------------------------------------

--
-- Table structure for table `signatures`
--

CREATE TABLE `signatures` (
  `id` int NOT NULL,
  `draft_id` int NOT NULL,
  `signed_by_user_id` int NOT NULL,
  `signature_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `signed_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ip_address` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_info` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `signature_requests`
--

CREATE TABLE `signature_requests` (
  `id` int NOT NULL,
  `draft_id` int NOT NULL,
  `token` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `expires_at` datetime(3) NOT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `social_links`
--

CREATE TABLE `social_links` (
  `id` int NOT NULL,
  `platform` enum('LinkedIn','Instagram','Facebook','YouTube') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `social_links`
--

INSERT INTO `social_links` (`id`, `platform`, `url`, `updated_at`) VALUES
(1, 'LinkedIn', '', '2026-06-24 10:31:48.025'),
(2, 'Instagram', '', '2026-06-24 10:31:48.025'),
(3, 'Facebook', '', '2026-06-24 10:31:48.025'),
(4, 'YouTube', '', '2026-06-24 10:31:48.025');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` int NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `priority` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `task_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `assigned_user_id` int DEFAULT NULL,
  `matter_id` int DEFAULT NULL,
  `due_date` datetime(3) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `reminder_date` datetime(3) DEFAULT NULL,
  `created_by_user_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `reminder_sent` tinyint(1) NOT NULL DEFAULT '0',
  `activity_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `templates`
--

CREATE TABLE `templates` (
  `id` int NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `category` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'court_form',
  `practice_area` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `matter_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by_user_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `templates`
--

INSERT INTO `templates` (`id`, `title`, `content`, `category`, `practice_area`, `matter_type`, `created_by_user_id`, `created_at`, `updated_at`, `description`, `is_active`) VALUES
(1, 'qwerty', 'qwerty\nasvdfg', 'agreement', 'Family Law', 'Family Law', 1, '2026-07-06 09:38:21.646', '2026-07-06 09:38:21.646', NULL, 1),
(2, '4edrftgyhuygtiyjgtbvtrvdcrtfgvctrfvcrt', 'hngbghn', 'court_form', NULL, NULL, 1, '2026-07-06 09:51:17.006', '2026-07-06 09:51:17.006', NULL, 1),
(3, 'CONTRACT ', 'A contract is an agreement that specifies certain legally enforceable rights and obligations pertaining to two or more parties. A contract typically involves consent to transfer of goods, services, money, or promise to transfer any of those at a future date.\n\n\n\nA contract is an agreement that specifies certain legally enforceable rights and obligations pertaining to two or more parties. A contract typically involves consent to transfer of goods, services, money, or promise to transfer any of those at a future date.', 'contract', NULL, NULL, 1, '2026-07-06 11:19:45.247', '2026-07-06 11:19:45.247', NULL, 1),
(4, 'testing', 'A content template is a standardized blueprint for web pages, articles, or documents. It acts as a paragraph-level guide for writers and designers, detailing required headings, word counts, and formatting. By streamlining content creation, it ensures brand consistency and efficiency across your digital platforms.Why use a content template?Efficiency: Eliminates the guesswork of starting from a blank slate.Consistency: Ensures every published page follows the same structural and stylistic rules.SEO & UX: Provides clear guidelines for meta descriptions, image placement, and content hierarchy.Standard Blog & Article Template StructureWhen drafting a blog post, a standard template organizes information into these core building blocks:Working Title: A placeholder for the main headline.Target Keywords: Specific SEO phrases to include in the copy.Introduction ($50$ - $100$ words): The hook and thesis statement.', 'agreement', 'Family Law', 'Family Law', 1, '2026-07-09 07:25:06.842', '2026-07-09 07:25:06.842', NULL, 1),
(6, 'hj', '# Implementation Plan - Reusable Legal Document Templates (Strict Scope)\n\nThis plan details how we will enhance the existing template and draft functionality without introducing new tables, new sidebars, or redesigning the UI.\n\n## Proposed Changes\n\n### [legel-backend]\n\n#### [MODIFY] [schema.prisma](file:///i:/legal%20case%20sonu/legel-backend/prisma/schema.prisma)\n1. Add `description` (`String? @db.Text`) and `is_active` (`Boolean @default(true)`) fields to the existing `Template` model.\n\n#### [MODIFY] [drafts.service.js](file:///i:/legal%20case%20sonu/legel-backend/src/modules/drafts/drafts.service.js)\n1. Add a helper function `resolveTemplateVariables(content, draft, matter, company)` to dynamically replace variables during PDF generation:\n   - `{{FirmName}}` -> `company.company_name`\n   - `{{AttorneyName}}` -> `matter.assigned_lawyer?.full_name`\n   - `{{MatterNumber}}` -> `matter.matter_number`\n   - `{{MatterTitle}}` -> `matter.title`\n   - `{{PartyName}}`, `{{RecipientName}}` -> `matter.client?.full_name`\n   - `{{RecipientAddress}}` -> Full multiline address of client\n   - `{{TodayDate}}` -> Today\'s formatted date\n   - `{{CaseNumber}}` -> `matter.case_number` or `matter.matter_number`\n   - `{{CourtName}}` -> `matter.court_name`\n2. Integrate this helper in both PDF generation template branches (letterhead and burgundy wave) so variables are resolved only when generating the PDF.\n\n#### [MODIFY] [templates.service.js](file:///i:/legal%20case%20sonu/legel-backend/src/modules/templates/templates.service.js)\n1. Update `getAll` to filter out templates where `is_active` is `false` when queried by non-admin users (or retrieve all and filter as appropriate).\n2. Support `description` and `is_active` fields in `create` and `update` methods.\n3. Add `duplicate(id, user)` method to clone a template:\n   - Sets title to `[Original Title] (Copy)`.\n   - Copies description, category, content, practice area, matter type, and status.\n\n#### [MODIFY] [templates.controller.js](file:///i:/legal%20case%20sonu/legel-backend/src/modules/templates/templates.controller.js)\n1. Implement `duplicate` controller.\n\n#### [MODIFY] [templates.routes.js](file:///i:/legal%20case%20sonu/legel-backend/src/modules/templates/templates.routes.js)\n1. Add `POST /templates/:id/duplicate` endpoint.\n\n---\n\n### [frontend]\n\n#### [MODIFY] [api.js](file:///i:/legal%20case%20sonu/frontend/src/services/api.js)\n1. Add template duplicate endpoint:\n   `duplicate: (id) => request(\\`/templates/\\${id}/duplicate\\`, { method: \'POST\', body: {} })`\n\n#### [MODIFY] [App.jsx](file:///i:/legal%20case%20sonu/frontend/src/App.jsx)\n1. **Create Draft Workflow**: Update the \"Create New Draft\" modal to let the user select a template from a dropdown (if starting from a template), copy the content verbatim, and save.\n2. **Template Creation Modal (`add-template`)**: Add inputs for `description` and `is_active` status.\n3. **Template Editing Modal (`edit-template`)**: Implement new modal with same fields for updating existing templates.\n4. **API Submit Hooks**: Support `edit-template` and `duplicate` in modal state machine.\n\n#### [MODIFY] [AdminPages.jsx](file:///i:/legal%20case%20sonu/frontend/src/pages/AdminPages.jsx)\n1. **`TemplateLibrary`**: Enhance the modal lists to:\n   - Display each template\'s `description`.\n   - Provide **Edit**, **Duplicate**, and **Delete** actions next to each template item.\n   - Refilter dynamically on status, search, and category.\n\n---\n\n## Verification Plan\n\n1. Execute prisma schema update: `npx prisma db push`.\n2. Verify creating a blank draft works.\n3. Verify creating a draft from a template copies content with variables (`{{FirmName}}`, etc.) intact in the editor.\n4. Export the draft as PDF and verify placeholders resolve correctly.\n5. Verify template duplicate and search functionality.\n', 'letter', NULL, NULL, 1, '2026-07-09 08:51:17.698', '2026-07-09 08:51:17.698', 'kjh', 1),
(7, 'notice', 'proceed \nor command se work mt krna files me krna taki me reject undo kru to code vaps vesa hi ho jaye\nand do not toouch anything else\n', 'notice', NULL, NULL, 1, '2026-07-09 09:03:34.619', '2026-07-09 09:03:34.619', 'alp ghj', 1),
(8, 'rt', 'Ye prompt use karo. Ye **strictly sirf Letter Preview ko polish karega**. Kisi aur module ko touch nahi karega.\n\n\n---\n\n# Deliverable\n\nRefine only the **Letter Preview layout** to a polished, professional legal document standard.\n\nThe implementation must remain isolated, minimal, production-safe, ', 'contract', NULL, NULL, 1, '2026-07-09 09:44:09.310', '2026-07-09 09:44:09.310', 'ytr', 1);

-- --------------------------------------------------------

--
-- Table structure for table `time_entries`
--

CREATE TABLE `time_entries` (
  `id` int NOT NULL,
  `matter_id` int NOT NULL,
  `user_id` int NOT NULL,
  `start_time` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `end_time` datetime(3) DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `is_running` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `time_entries`
--

INSERT INTO `time_entries` (`id`, `matter_id`, `user_id`, `start_time`, `end_time`, `duration_minutes`, `is_running`, `created_at`) VALUES
(85, 20, 1, '2026-07-11 07:25:38.720', '2026-07-11 07:26:33.197', 6, 0, '2026-07-11 07:25:38.721'),
(86, 20, 1, '2026-07-11 09:27:39.968', '2026-07-11 09:31:38.892', 6, 0, '2026-07-11 09:27:39.969'),
(88, 8, 1, '2026-01-12 18:30:00.000', NULL, 60, 0, '2026-07-11 09:40:57.588'),
(89, 8, 1, '2026-01-12 18:30:00.000', NULL, 6, 0, '2026-07-11 09:40:57.595'),
(91, 11, 1, '2026-01-22 18:30:00.000', NULL, 60, 0, '2026-07-11 09:40:57.605'),
(92, 11, 1, '2026-02-01 18:30:00.000', NULL, 176, 0, '2026-07-11 09:40:57.609'),
(93, 17, 1, '2026-02-06 18:30:00.000', NULL, 72, 0, '2026-07-11 09:40:57.614'),
(94, 17, 1, '2026-02-08 18:30:00.000', NULL, 138, 0, '2026-07-11 09:40:57.621'),
(95, 17, 1, '2026-02-10 18:30:00.000', NULL, 108, 0, '2026-07-11 09:40:57.625'),
(96, 17, 1, '2026-02-10 18:30:00.000', NULL, 42, 0, '2026-07-11 09:40:57.630'),
(97, 17, 1, '2026-02-10 18:30:00.000', NULL, 120, 0, '2026-07-11 09:40:57.635'),
(101, 20, 1, '2026-07-11 10:00:41.020', '2026-07-11 10:00:42.665', 6, 0, '2026-07-11 10:00:41.021'),
(108, 20, 1, '2026-07-17 20:29:38.803', '2026-07-17 20:29:55.653', 6, 0, '2026-07-17 20:29:38.804'),
(109, 8, 1, '2026-07-17 21:15:08.031', '2026-07-17 21:23:43.649', 12, 0, '2026-07-17 21:15:08.032'),
(119, 15, 1, '2026-07-23 22:04:39.853', '2026-07-23 22:05:15.246', 6, 0, '2026-07-23 22:04:39.853'),
(121, 20, 1, '2026-07-24 05:56:00.271', '2026-07-24 05:56:24.093', 6, 0, '2026-07-24 05:56:00.272'),
(122, 22, 1, '2026-07-24 06:01:21.546', '2026-07-24 06:02:32.035', 6, 0, '2026-07-24 06:01:21.547'),
(123, 20, 1, '2026-07-24 06:02:55.451', '2026-07-24 06:05:21.038', 6, 0, '2026-07-24 06:02:55.453'),
(124, 20, 1, '2026-07-24 06:10:47.705', '2026-07-24 06:11:04.756', 6, 0, '2026-07-24 06:10:47.706'),
(125, 22, 1, '2026-07-24 06:31:20.221', '2026-07-24 06:31:29.210', 6, 0, '2026-07-24 06:31:20.222'),
(126, 22, 1, '2026-07-24 07:02:42.817', '2026-07-24 07:03:07.965', 6, 0, '2026-07-24 07:02:42.818'),
(127, 22, 1, '2026-07-24 07:39:42.859', '2026-07-24 07:39:54.999', 6, 0, '2026-07-24 07:39:42.860'),
(128, 24, 9, '2026-07-24 07:58:05.435', '2026-07-24 08:00:14.766', 6, 0, '2026-07-24 07:58:05.436'),
(129, 22, 1, '2026-07-24 07:58:42.642', '2026-07-24 07:58:46.880', 6, 0, '2026-07-24 07:58:42.643'),
(130, 24, 9, '2026-07-24 08:45:33.406', '2026-07-24 08:46:16.802', 6, 0, '2026-07-24 08:45:33.407'),
(131, 24, 1, '2026-07-28 13:05:27.639', '2026-07-28 13:06:41.825', 6, 0, '2026-07-28 13:05:27.640');

-- --------------------------------------------------------

--
-- Table structure for table `trust_accounts`
--

CREATE TABLE `trust_accounts` (
  `id` int NOT NULL,
  `client_id` int NOT NULL,
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trust_transactions`
--

CREATE TABLE `trust_transactions` (
  `id` int NOT NULL,
  `trust_account_id` int NOT NULL,
  `matter_id` int DEFAULT NULL,
  `client_id` int NOT NULL,
  `transaction_type` enum('deposit','applied_to_invoice','refund','adjustment') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reference` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_by_user_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `full_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','lawyer','client') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'client',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `must_reset_password` tinyint(1) NOT NULL DEFAULT '0',
  `last_login_at` datetime(3) DEFAULT NULL,
  `outlook_refresh_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `outlook_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `outlook_token_expires` datetime(3) DEFAULT NULL,
  `signature` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `is_active`, `created_at`, `updated_at`, `must_reset_password`, `last_login_at`, `outlook_refresh_token`, `outlook_token`, `outlook_token_expires`, `signature`) VALUES
(1, 'Victoria Admin', 'admin@vktori.com', '$2b$10$bbs0M.M8oUpm7qT6uKP5/uC2dRckM8uiIBY8uaipRtLLJtaRFHw.u', 'admin', 1, '2026-04-21 12:47:06.172', '2026-07-29 06:25:04.100', 0, '2026-07-29 06:25:04.098', NULL, NULL, NULL, '<img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASAAAAB4CAYAAABSKS+uAAAQAElEQVR4Aeyde4wkRR3Hf7/evZsZ8a0YNODtISoGRYxy1wsit9NL8JH4ihoUlTvxdZpoDBofUe/uDx9E4yvRiIq7ihoT/8A/TNDszO5xErdHQQ0QcmL0VkFEBIHA3fSwu/3zV9XTs3PHzezs7ExPT8+3rqq7uqu7qvpTM9/71WN6HYIDARAAgQERgAANCDyKBQEQIIIA4VMAAiAwMAIQoIGhR8EgAAIQIHwGQAAEBkYAAjQw9CgYBEAAAoTPAAiAwMAIDEyABvbEKBgEQCA1BCBAqWkKVAQERo8ABGj02hxPDAKpIQABSrgp3IXqhFuu7jNhcj64xy0FK7q/zy3XHnLLwfKOuWMfS7hKo1ccnjg1BCBACTWFOx/81p2vCYV8hIj3myBCzyamMd2fSiRPIaJxHnM+785Vd2kcHgQyT8DJ/BOm4AHVyvkICb2SRJprs6Sicz+L3Kwnv6thQcWIWOip5PAMRIjgRoAABKjPjezOH7tQheWbphgmelD3V1MoU76X3+57hVMXpwvn+15+r4aiCtQeTTd+QkXohp2lY5eZAwQQyCqB0ROgBFty14LkWZxr4iLFGXubCs2n/EsKB+NzzXvfK8yqVRSLUJ4dZ19zOuIgkDUCEKA+tmgQ1nztdJ1ji3D4U/7UlpKNt9kYEdJ7vkGkW6GzzaB1m8uRBAJDTQAC1Kfmc3XQWbN+qQbtWcnN/lTuahPvJLAj2mVjHSPSq4VndAsPApkkAAHqQ7NOloI/qQHzSps1039Wtoavt/EON/5UQcVHtDumNwjt2lE+9naNwQ89ATzAiQQgQCcS2eSxWd8jTOeRcUyH/WL+tFtedcq/zeGGgkM/IjMnRkSOOBAg5QCfPQIQoB62aTR1zvtNlkz0kIrPi0y8mxBZQaHeKhr4Yd3Ag0DmCECAetSkVnwcXoizk1DeFMe737PqGJNwuK37PHAnCKSXAASoB21jZ6qaxMeu83ncVHtXBa2SShCJ43d1N24CgZQTgAD1ooGOm6mSPa3W+Wy0KBFR84eIWQoEBwIZJAAB2mSj2ul2namy2TAdNOt4bLwHG1ZnstFRoIvMHgEEskYAArSJFrVdL/MbL5uHLOmg85SN9mgjJA+QdsGY6ZEeZYlsRpNAap8aArSZpgnXfiqhls/2zWR1snuZnF+Rmj8aojVFBAcC2SIAAeqyPa31Q7I7ul32R/teb8Mb4xyj8uIj7EEgGwQgQN224/HWz4Fus2l7X0hLFLtV2RtHsQeBrBCAAHXRkpE1In22foii2TQWU0Vmds2+i4BbQCC1BCBA3TRNyHPEOjqs9+rYT3+sH83bepHQ/DJeyDlkj7EBgQwRgABtsDHt2w2JziIR9dL/BYLRSqAN1hKXg8BwEIAAbaCdTny74ZZc/rUbuL2rS0Wk3kby1K4ywE0gMEAC6xVd/3CvdxnST/Z2w5suYvOK1b7CYXWmACHCYkQDAiFTBCBAHTZnENZKKgIberthh1m3vUw7eliM2JYQEoeZAASog9a7YKH2Yr3sQg06Hix3bOTthvaeTWx4bTHi6QQHAhkjAAHqoEHDkK6KL1veGk7H8WT2jcWIE9H0fzKl9qIU5AEC6xFIXIB2lqs3uuVg2Z2v3WDfobNeDQecHn3ppbHmp6u3G/bqGVZoguBAIEMEEhcgJscMpo7rHParyeEFFaMjbrmW3j/El8SKZ2rjmldDs7ymzZVIAoGhI5C4AOkgymMnUNL/1dXCiMRoebJc+4Vbru5Og3V0ovVzQr0TOcRq6EQwo5ABEeibALV6Hp3VeR8xfYvH+VwVoz0ab/4jfeOa/hYinqFIkNQ6CjSohTQIURq09UN1J1gNXSeBXcYIJC5ALHQxCb0+XA6f6XuFWfsOHUe2C4Wf0LQ/K98lDbFX64g0qIXULErzwYLttqkoUZ9cGqyfxqNhNXQDBSLZIpC4ABHzFYpwgtkp6t568xcgKt4Tvro4nX+Z7+W3kwqStY5I9hNTs4VE6iZUwHZpug4M84wKkbh2UPuxb0/O1V6i6b3xwtfFGfleob+/94oLwh4ERoxA8gJEFJUpNEEtnBEk/dLPajhgLCTfy/OaKPHs8aIkpE4HtcMPiSO3TpaDQypIe18+J0/R8115a/3U33Souf+yq0xw0+AIoOShIRCJQbLVtWUKyztUKJZ3zAcf66T4NVHK7TGiZAUplCkVo2s1NLptKhhmlu07W5zagzrV/5Mdc8HrOsn/uGtCuiI+Zkc6ql98PfYgAAKdE7Bi0PnlPbqSSTXDWkLjWoGPdjPjZQXpksJBFaP3atguwudot+wLmvXfKXI6ciKXOw79SoVuaXK+9sWOu2jM2sWzmSyZcmxssBvFpBVoYzVqKjwIDB2B6IOdYLXV8rmGhG6zRbJuhbZRNONVnTRT8HPV+MuviZ37ynTuDt8rfHbRyz+PhV4jzD/Wu1c0GL9NRD7dSRet3v2q10Fmzc0pCLadBH+gMAVNgSr0koD9YPcyw/XyqhQLH/S9/Lkiq1/Sa+8moX/q3vi8kLyFIjE64na7OFFz0sHsX1eKuSvyTu5pIvQBNbcaA9lC9lflrbtoTd0vcuhHml0aPP5AYRpaAXXoOYHEBSh+gsr0KZ/RrtMZ/nR+m+gUvHafGuM4eo0OUMtuMmJUCmRyvvpuPbdhf3CKH61M57+n5UxJ+y7a8mQ5uN2IHjFfVi/o3pR0v0x1RIVaq0Y1c4AAAlkhMDABagZY0Sl43ytstwPLJHuIqWGxaJwk5JnJ+eBS2oRbp4s2LkRmDGm3ftHPjoqR09xyYKb4j7jzwYJrLLJydfcgVmmLUL2dBC8lixoH24wQqH+w0/E0xuJQIZo1FktdjGbUMiIVIUdC+rVbDgK3FKy45ZrZr+p+P3XhjuuiMX9Gs/gbsXm9qmg09maAysYnVJR0TEjsuiNaWxBpxMn8qHZR6zEThTWBsmNJtHln8mGOBEiYziC4FBNA1TZKIFUC1Fz5uhi9h52x99rzkR7kVIzGVJTMXusu+9xy8GWb3sXGdtGKuS/5Xv4sv1iY1Czq3UC5V8vYEwWe1TLXLDK9qMmPk4ir16k4HS9QFPIRrZu487WVTpcaNOW7Fo3HpJjIGePPrSUgBgLDT0C/xOl+iMWprdcKyfeF6E5h5yat7W0aP6SiEM9wfdKdD+bOLwVnalrXPloKwBM2A6HDvvmZiA05u+7IjxdD1ldpi45b6Wzbn7UeRpzqwmXvrm+0liYmMuYIfc0t16674DePPMuc6jQY64eI95NxQkuLF+ei2UNzjAACGSCQegEyjCte4f0VL//CSnHrRSoE52r8Ygn5pfrlN4KkBghNO0x/dctBabJUvXLnjcHzzX0bCg5rdy+6w58uTEWx47fWKpsqLPkqTBUdt9Ku3Mv8Yn7K9/LbNbDtNhqBMgskidSCCq8X4qNknbwz3LLl9p3l6rvsYSeb2Pqx1wp+DmI5YJMlAkMhQCcDbgeVi/mLdHzmOyadicyzeML8A16hO91ybdkt1WZN2npBB5b36TWR9UMSWRx6YmOeqCFQZoGkipTvPeHNYyuPqWXGP7F5CZ3KxD/WunVoDbF27eydVvRsDBsQyBAB86Ud6sfxp/MfZuYfCtNdxPTg2sPIuLBcoV/25Z2loy3HTtyFqgoPx6Jjvug9tTR+d+mT7vO93LuE5N1av/9G9VNraHzrPW45uNWNZ9dOWIAZdQlJ60bqpCMh1QvhQWCoCAy9ABnai8XclZVi/rnaHXq68OormPhnRPI/Nokk48xjB1oOBCfUzal4heuc5eUXE9WtIRIdTKeXaD3VyuHo/Uelqs6sVUO3HITkOPMUuXt9/Bo/IoFt5ghkQoCaW6VSPOWWRS93uX5pn9F0np2QdEym6YxGT2L99NXSiK0hErpKxfHvTLKo1VjzrGcp2qgwmQNNk7/oBh4E2hEY2rTMCVBzSwitzpD5Gpvg0Ok7fXlyczqv8vWN41AeJ1CNtB5HtNv4NfObtUWvcIEfz66R7NFu2vdF5Ihod1JE/sEsNy+H+Tf0uHhkBwKpIZBpAap4p7yHRLQ7pryFnsZHH7tGY9abMRZhOo/UCdEvo3cv68EAvB281kFr7aa9vzJdONN0J3U/sVgsnH/LJfzwAKqEIkEgEQKZFiBD0PcKlxPxT8k6uWyyHHzcRsd4n93rhvHOH6UADwLJE8i8ABmkx5a3fkD3hzXo8At9Ra2fn2tklzkmnXY3FkgUH8otKg0CQ0tgJATo1kv5qENiRChqKIffGkWI1EI6EMexBwEQSJbASAiQQfo7r3BIrZ14lit6bqGrTRoCCIDAYAhEX8TBlJ14qWrt6EyX3N8omOmjO0vHLmscIwICILAhApu9eKQEKPrJBT+zCVqeHWdf0zGiIAACCRIYKQGi+JflTAeJ2ScdiVafJzgQAIGBEBgZAXLLtZkG4VU5QKvhp4nMCkWa2DF3DH96h+BAIHkCIyFA0U8uZHeEl2ftosNxarzDx2HnpK/fILi2BJAIApslMBICRMI3NECFof1LF/W1P2K7YcxHG+mIgAAIJEZgRASIohfNM91krR/Fu2tBzNiP9sFY9Sk8S0/BgwAIJEwg8wIUdb/qVEWurcfo4BQHav3cboaBWPiJ8XnsQQAEkiPQtQAlV8VNlrRCExS7kBrjPmSdY36SYWJnX3iTPMdEEEAABJIjkH0BcmhNgJoGnkldKM4h3Vm/Ug322gg2IAACiRHIvgARbYtp1gee40P6/fSW3zYOHMdrxBEBARBIhMAICJATW0AndL8afMWMA1Eo/2mcQSTdBFC7zBBwMvMkrR6EJRIgplYCpNNgRORI8ytc9QQ8CIBAvwlkX4BEovf+hKSzXifFuWotIHH8k6biJAiAQN8IZFqA3Plggay66IQ7txQgIdGrmGoEBwIgkCiB4ROgDvFMloI/qbBE1g/T4YqXf1OLWyMGQlFXjeBAAASSIhB9+ZIqLaFy3FL1Tqm/cF4NoMN+Mf+iNkVbBsJhY7aszbVIAgEQ6CEB++XrYX4Dz2pnqfoXYn6+rQjzo+uIj14mQkzEMnYPwYEACCRKIHMCpFrygoigTm5J+Mco3m7LeqEZI1rFSuh2mJBGRIDQawKZEyBSPYkgydFwJf/OKN5uCwuoHR2kgUA/CWRKgOo/PBUDTGXlp3+4lO8y8fZBFcvcwWG7caL2WSAVBECgKwKZEaDJcnA9hXxEKWgvjNQQkhfSOi6apteL9A7VoLs1Bg8CIJAggUwIkJ31EnljzE1EQiJ+lVsOQrcUrLrl2gNuOfi3DaXqMbdcDd1yLSShaJqe6O6VMPcOauuQCAIg0GsCmRAgNXfO0tBgw8zmudSuIdZ/Gpena+JpNjAXiJjNsDMZx7SkM2Vn3HIJP2wOEUAABJIjoF/O5ArrV0kh01UicoSIbxPhHwrJvDDdJUT/0nCHOUdE3zWhKe2vzHLz8mruPD0PDwIgMAACmRCg3xfzX69MF870vdy5lencprgqEgAAAY1JREFUlRWv4FWK+edWvPzpGs4x53wvv9eEitdIe8FisXA+LJ8BfOpQ5EYJZPb6TAhQZlsHDwYCGScAAcp4A+PxQCDNBCBAaW4d1A0EMk4AApT+BkYNQSCzBCBAmW1aPBgIpJ8ABCj9bYQagkBmCUCAMtu0eDAQ2DyBfucAAeo3YeQPAiDQkgAEqCUaJIAACPSbAASo34SRPwiAQEsCEKCWaJAAAiDQbwIQoH4TRv4gAAItCUCAWqJBAgiAQL8JQID6TRj5gwAItCTQUoBa3oEEEAABEOgRAQhQj0AiGxAAgY0TgABtnBnuAAEQ6BEBCFCPQCKbHhJAViNDAAI0Mk2NBwWB9BGAAKWvTVAjEBgZAhCgkWlqPCgIpI9A+gQofYxQIxAAgT4RgAD1CSyyBQEQWJ8ABGh9RrgCBECgTwQgQH0Ci2yHkQDqnDQBCFDSxFEeCIBAgwAEqIECERAAgaQJQICSJo7yQAAEGgQgQA0UiIAACCRNAAKUNHGUBwIg0CAAAWqgQAQEQCBpAv8HAAD//7qktQUAAAAGSURBVAMAoHdvPGe9B1EAAAAASUVORK5CYII=\" alt=\"Digital Signature\" draggable=\"true\" style=\"max-height: 50px; vertical-align: middle; display: inline-block; cursor: grab;\" />'),
(3, 'Sarah mitchell', 'client@vktori.com', '$2b$10$deUM39QsT793dHQ6946VeOna6tNmkzmphhLdMbdRXNTkQfPuHoB7a', 'client', 1, '2026-04-21 12:47:06.355', '2026-07-25 05:14:56.434', 0, '2026-07-25 05:14:56.434', NULL, NULL, NULL, NULL),
(9, 'lawyer john', 'lawyer@vktori.com', '$2b$10$i9nXREvgEgASr9uuro2J2.aZKCkLQ3tsf.gFcDK9dpNhr9h1fKuku', 'lawyer', 1, '2026-07-24 07:23:59.778', '2026-07-25 07:26:44.823', 0, '2026-07-25 07:26:44.822', NULL, NULL, NULL, NULL),
(10, 'Sourabh', 's@gmail.com', '$2b$10$G5NtIKvmvwp6fQMUodvE6OqUwd3wq0YpOzF/ue6Fvhw8WAUrmF3cK', 'client', 1, '2026-07-24 07:57:32.704', '2026-07-24 09:03:23.469', 1, '2026-07-24 09:03:23.469', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `user_id`, `role`) VALUES
(24, 1, 'admin'),
(25, 1, 'lawyer'),
(23, 3, 'client'),
(27, 9, 'lawyer');

-- --------------------------------------------------------

--
-- Table structure for table `_matterparties`
--

CREATE TABLE `_matterparties` (
  `A` int NOT NULL,
  `B` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_matterparties`
--

INSERT INTO `_matterparties` (`A`, `B`) VALUES
(1, 22),
(12, 23),
(25, 24);

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('0cae0170-0c5d-4c91-b82c-e908956a3021', 'f4e7df75550dc2e5ce56e6f83800babe12daf760c12009a098b6a0ec20c65d45', '2026-07-14 11:01:53.648', '20260706130700_add_missing_tables', '', NULL, '2026-07-14 11:01:53.648', 0),
('41dbf8c7-0622-4621-b3fa-a2e8812b2d52', 'f4e7df75550dc2e5ce56e6f83800babe12daf760c12009a098b6a0ec20c65d45', NULL, '20260706130700_add_missing_tables', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260706130700_add_missing_tables\n\nDatabase error code: 1060\n\nDatabase error:\nDuplicate column name \'business_address\'\n\nPlease check the query number 1 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260706130700_add_missing_tables\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name=\"20260706130700_add_missing_tables\"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226', '2026-07-14 11:01:53.647', '2026-07-14 11:01:45.192', 0),
('57a1dc74-ebea-4d93-a44c-599d996224df', 'fa764bf488439f9b9447ccb4116cd9a048ee7d9da2c22d548eeeee93138b7b48', '2026-07-14 11:02:00.646', '20260714110000_add_signature_and_email_tracking', NULL, NULL, '2026-07-14 11:02:00.628', 1),
('605c9074-1a97-4e95-84b3-f5f2114bc4eb', '114ae13a877a6ee0e3d36fa97bb4cd2032350470a45140976088b8de17e4a9ce', '2026-07-06 12:18:19.755', '20260418114557_add_communication_read_status', '', NULL, '2026-07-06 12:18:19.755', 0),
('e02b580c-f655-48f9-9b33-218cf21f6c15', 'b24ada50a2f76ac3d7ce5251adee882eb9b4355369fe3ca841010fb4b8f19e44', '2026-07-28 13:50:59.438', '20260728140000_add_matter_adaptive_fields', '', NULL, '2026-07-28 13:50:59.438', 0),
('e86d63eb-4f47-42e9-842c-80be6189f004', 'a053af150014b0e4bd3f8847a1380986640fb45eb2ac241b13cd342c4a4c3f20', '2026-07-06 12:17:59.028', '20260414121909_init', '', NULL, '2026-07-06 12:17:59.028', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activities_matter_id_fkey` (`matter_id`),
  ADD KEY `activities_actor_user_id_fkey` (`actor_user_id`);

--
-- Indexes for table `calendar_categories`
--
ALTER TABLE `calendar_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `calendar_categories_name_key` (`name`);

--
-- Indexes for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `calendar_events_matter_id_fkey` (`matter_id`),
  ADD KEY `calendar_events_activity_id_fkey` (`activity_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `clients_user_id_key` (`user_id`),
  ADD KEY `clients_created_at_idx` (`created_at`);

--
-- Indexes for table `communications`
--
ALTER TABLE `communications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `communications_matter_id_fkey` (`matter_id`),
  ADD KEY `communications_sender_user_id_fkey` (`sender_user_id`),
  ADD KEY `communications_parent_id_fkey` (`parent_id`),
  ADD KEY `communications_activity_id_fkey` (`activity_id`),
  ADD KEY `communications_email_account_id_fkey` (`email_account_id`);

--
-- Indexes for table `company_profile`
--
ALTER TABLE `company_profile`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `conflict_checks`
--
ALTER TABLE `conflict_checks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conflict_checks_created_by_user_id_fkey` (`created_by_user_id`);

--
-- Indexes for table `court_form_field_mappings`
--
ALTER TABLE `court_form_field_mappings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `court_form_field_mappings_template_id_fkey` (`template_id`);

--
-- Indexes for table `court_form_mappings`
--
ALTER TABLE `court_form_mappings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `court_form_mappings_template_id_pdf_field_name_key` (`template_id`,`pdf_field_name`);

--
-- Indexes for table `court_form_templates`
--
ALTER TABLE `court_form_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `court_form_templates_form_number_key` (`form_number`);

--
-- Indexes for table `custom_field_definitions`
--
ALTER TABLE `custom_field_definitions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `documents_matter_id_fkey` (`matter_id`),
  ADD KEY `documents_uploaded_by_user_id_fkey` (`uploaded_by_user_id`),
  ADD KEY `documents_folder_id_fkey` (`folder_id`);

--
-- Indexes for table `document_categories`
--
ALTER TABLE `document_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `document_categories_name_key` (`name`);

--
-- Indexes for table `drafts`
--
ALTER TABLE `drafts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `drafts_matter_id_fkey` (`matter_id`),
  ADD KEY `drafts_created_by_user_id_fkey` (`created_by_user_id`),
  ADD KEY `drafts_last_updated_by_user_id_fkey` (`last_updated_by_user_id`);

--
-- Indexes for table `email_accounts`
--
ALTER TABLE `email_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email_accounts_user_id_fkey` (`user_id`);

--
-- Indexes for table `event_attendees`
--
ALTER TABLE `event_attendees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_attendees_event_id_fkey` (`event_id`),
  ADD KEY `event_attendees_user_id_fkey` (`user_id`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expenses_matter_id_idx` (`matter_id`),
  ADD KEY `expenses_created_at_idx` (`created_at`),
  ADD KEY `expenses_created_by_id_fkey` (`created_by_id`);

--
-- Indexes for table `folders`
--
ALTER TABLE `folders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `folders_matter_id_fkey` (`matter_id`);

--
-- Indexes for table `generated_forms`
--
ALTER TABLE `generated_forms`
  ADD PRIMARY KEY (`id`),
  ADD KEY `generated_forms_template_id_fkey` (`template_id`),
  ADD KEY `generated_forms_matter_id_fkey` (`matter_id`),
  ADD KEY `generated_forms_created_by_fkey` (`created_by`);

--
-- Indexes for table `generic_activities`
--
ALTER TABLE `generic_activities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoices_invoice_number_key` (`invoice_number`),
  ADD KEY `invoices_matter_id_fkey` (`matter_id`),
  ADD KEY `invoices_created_by_user_id_fkey` (`created_by_user_id`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_items_invoice_id_fkey` (`invoice_id`);

--
-- Indexes for table `lawyers`
--
ALTER TABLE `lawyers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lawyers_user_id_key` (`user_id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leads_created_by_user_id_fkey` (`created_by_user_id`),
  ADD KEY `leads_converted_client_id_fkey` (`converted_client_id`);

--
-- Indexes for table `matters`
--
ALTER TABLE `matters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `matters_matter_number_key` (`matter_number`),
  ADD KEY `matters_client_id_idx` (`client_id`),
  ADD KEY `matters_assigned_lawyer_id_idx` (`assigned_lawyer_id`),
  ADD KEY `matters_created_by_user_id_fkey` (`created_by_user_id`),
  ADD KEY `matters_status_idx` (`status`),
  ADD KEY `matters_created_at_idx` (`created_at`);

--
-- Indexes for table `matter_custom_field_values`
--
ALTER TABLE `matter_custom_field_values`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `matter_custom_field_values_matter_id_field_definition_id_key` (`matter_id`,`field_definition_id`),
  ADD KEY `matter_custom_field_values_field_definition_id_fkey` (`field_definition_id`);

--
-- Indexes for table `matter_status_history`
--
ALTER TABLE `matter_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `matter_status_history_matter_id_fkey` (`matter_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_fkey` (`user_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payments_invoice_id_fkey` (`invoice_id`),
  ADD KEY `payments_matter_id_fkey` (`matter_id`),
  ADD KEY `payments_created_by_user_id_fkey` (`created_by_user_id`);

--
-- Indexes for table `practice_areas`
--
ALTER TABLE `practice_areas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `practice_areas_name_key` (`name`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settings_key_key` (`key`);

--
-- Indexes for table `signatures`
--
ALTER TABLE `signatures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `signatures_draft_id_fkey` (`draft_id`);

--
-- Indexes for table `signature_requests`
--
ALTER TABLE `signature_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `signature_requests_token_key` (`token`),
  ADD KEY `signature_requests_draft_id_fkey` (`draft_id`);

--
-- Indexes for table `social_links`
--
ALTER TABLE `social_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `social_links_platform_key` (`platform`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tasks_assigned_user_id_fkey` (`assigned_user_id`),
  ADD KEY `tasks_created_by_user_id_fkey` (`created_by_user_id`),
  ADD KEY `tasks_matter_id_fkey` (`matter_id`),
  ADD KEY `tasks_activity_id_fkey` (`activity_id`);

--
-- Indexes for table `templates`
--
ALTER TABLE `templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `templates_created_by_user_id_fkey` (`created_by_user_id`);

--
-- Indexes for table `time_entries`
--
ALTER TABLE `time_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `time_entries_matter_id_fkey` (`matter_id`),
  ADD KEY `time_entries_user_id_fkey` (`user_id`);

--
-- Indexes for table `trust_accounts`
--
ALTER TABLE `trust_accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `trust_accounts_client_id_key` (`client_id`);

--
-- Indexes for table `trust_transactions`
--
ALTER TABLE `trust_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `trust_transactions_trust_account_id_fkey` (`trust_account_id`),
  ADD KEY `trust_transactions_matter_id_fkey` (`matter_id`),
  ADD KEY `trust_transactions_client_id_fkey` (`client_id`),
  ADD KEY `trust_transactions_created_by_user_id_fkey` (`created_by_user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_roles_user_id_role_key` (`user_id`,`role`);

--
-- Indexes for table `_matterparties`
--
ALTER TABLE `_matterparties`
  ADD UNIQUE KEY `_matterparties_AB_unique` (`A`,`B`),
  ADD KEY `_matterparties_B_index` (`B`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=230;

--
-- AUTO_INCREMENT for table `calendar_categories`
--
ALTER TABLE `calendar_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `calendar_events`
--
ALTER TABLE `calendar_events`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `communications`
--
ALTER TABLE `communications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=258;

--
-- AUTO_INCREMENT for table `company_profile`
--
ALTER TABLE `company_profile`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `conflict_checks`
--
ALTER TABLE `conflict_checks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `court_form_field_mappings`
--
ALTER TABLE `court_form_field_mappings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=151;

--
-- AUTO_INCREMENT for table `court_form_mappings`
--
ALTER TABLE `court_form_mappings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=737;

--
-- AUTO_INCREMENT for table `court_form_templates`
--
ALTER TABLE `court_form_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `custom_field_definitions`
--
ALTER TABLE `custom_field_definitions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=184;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=165;

--
-- AUTO_INCREMENT for table `document_categories`
--
ALTER TABLE `document_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `drafts`
--
ALTER TABLE `drafts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `email_accounts`
--
ALTER TABLE `email_accounts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `event_attendees`
--
ALTER TABLE `event_attendees`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `folders`
--
ALTER TABLE `folders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `generated_forms`
--
ALTER TABLE `generated_forms`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=144;

--
-- AUTO_INCREMENT for table `generic_activities`
--
ALTER TABLE `generic_activities`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `lawyers`
--
ALTER TABLE `lawyers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `matters`
--
ALTER TABLE `matters`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `matter_custom_field_values`
--
ALTER TABLE `matter_custom_field_values`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `matter_status_history`
--
ALTER TABLE `matter_status_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `practice_areas`
--
ALTER TABLE `practice_areas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `signatures`
--
ALTER TABLE `signatures`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `signature_requests`
--
ALTER TABLE `signature_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `social_links`
--
ALTER TABLE `social_links`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `templates`
--
ALTER TABLE `templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `time_entries`
--
ALTER TABLE `time_entries`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=132;

--
-- AUTO_INCREMENT for table `trust_accounts`
--
ALTER TABLE `trust_accounts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trust_transactions`
--
ALTER TABLE `trust_transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_actor_user_id_fkey` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `activities_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `calendar_events`
--
ALTER TABLE `calendar_events`
  ADD CONSTRAINT `calendar_events_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `generic_activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `calendar_events_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `clients_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `communications`
--
ALTER TABLE `communications`
  ADD CONSTRAINT `communications_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `generic_activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `communications_email_account_id_fkey` FOREIGN KEY (`email_account_id`) REFERENCES `email_accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `communications_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `communications_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `communications` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `communications_sender_user_id_fkey` FOREIGN KEY (`sender_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `conflict_checks`
--
ALTER TABLE `conflict_checks`
  ADD CONSTRAINT `conflict_checks_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `court_form_field_mappings`
--
ALTER TABLE `court_form_field_mappings`
  ADD CONSTRAINT `court_form_field_mappings_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `court_form_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `court_form_mappings`
--
ALTER TABLE `court_form_mappings`
  ADD CONSTRAINT `court_form_mappings_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `court_form_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_folder_id_fkey` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `documents_uploaded_by_user_id_fkey` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `drafts`
--
ALTER TABLE `drafts`
  ADD CONSTRAINT `drafts_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `drafts_last_updated_by_user_id_fkey` FOREIGN KEY (`last_updated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `drafts_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `email_accounts`
--
ALTER TABLE `email_accounts`
  ADD CONSTRAINT `email_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `event_attendees`
--
ALTER TABLE `event_attendees`
  ADD CONSTRAINT `event_attendees_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `calendar_events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `event_attendees_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `expenses_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `folders`
--
ALTER TABLE `folders`
  ADD CONSTRAINT `folders_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `generated_forms`
--
ALTER TABLE `generated_forms`
  ADD CONSTRAINT `generated_forms_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `generated_forms_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `generated_forms_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `court_form_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `invoices_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lawyers`
--
ALTER TABLE `lawyers`
  ADD CONSTRAINT `lawyers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_converted_client_id_fkey` FOREIGN KEY (`converted_client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `leads_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `matters`
--
ALTER TABLE `matters`
  ADD CONSTRAINT `matters_assigned_lawyer_id_fkey` FOREIGN KEY (`assigned_lawyer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `matters_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `matters_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `matter_custom_field_values`
--
ALTER TABLE `matter_custom_field_values`
  ADD CONSTRAINT `matter_custom_field_values_field_definition_id_fkey` FOREIGN KEY (`field_definition_id`) REFERENCES `custom_field_definitions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `matter_status_history`
--
ALTER TABLE `matter_status_history`
  ADD CONSTRAINT `matter_status_history_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `signatures`
--
ALTER TABLE `signatures`
  ADD CONSTRAINT `signatures_draft_id_fkey` FOREIGN KEY (`draft_id`) REFERENCES `drafts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `signature_requests`
--
ALTER TABLE `signature_requests`
  ADD CONSTRAINT `signature_requests_draft_id_fkey` FOREIGN KEY (`draft_id`) REFERENCES `drafts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_activity_id_fkey` FOREIGN KEY (`activity_id`) REFERENCES `generic_activities` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_assigned_user_id_fkey` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `templates`
--
ALTER TABLE `templates`
  ADD CONSTRAINT `templates_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `time_entries`
--
ALTER TABLE `time_entries`
  ADD CONSTRAINT `time_entries_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `time_entries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `trust_accounts`
--
ALTER TABLE `trust_accounts`
  ADD CONSTRAINT `trust_accounts_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `trust_transactions`
--
ALTER TABLE `trust_transactions`
  ADD CONSTRAINT `trust_transactions_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `trust_transactions_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `trust_transactions_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `trust_transactions_trust_account_id_fkey` FOREIGN KEY (`trust_account_id`) REFERENCES `trust_accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `_matterparties`
--
ALTER TABLE `_matterparties`
  ADD CONSTRAINT `_matterparties_A_fkey` FOREIGN KEY (`A`) REFERENCES `clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `_matterparties_B_fkey` FOREIGN KEY (`B`) REFERENCES `matters` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
