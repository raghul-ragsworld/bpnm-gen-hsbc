import json
import argparse
import heapq
import math
import textwrap
import urllib.request
from copy import deepcopy
from dataclasses import dataclass
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from lxml import etree as ET


ROOT = Path(__file__).parent
OUTPUT = ROOT / "onboarding_bpmn"
NS = {"bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL",
      "bpmndi": "http://www.omg.org/spec/BPMN/20100524/DI",
      "dc": "http://www.omg.org/spec/DD/20100524/DC",
      "di": "http://www.omg.org/spec/DD/20100524/DI",
      "bioc": "http://bpmn.io/schema/bpmn/biocolor/1.0",
      "xsi": "http://www.w3.org/2001/XMLSchema-instance"}
COLORS = {"manualTask": "#F6B94F", "userTask": "#9ACAF0", "serviceTask": "#9DD7AA",
          "scriptTask": "#9DD7AA", "boundaryEvent": "#FFE275", "endEvent": "#EF9292"}
ROLE_LANES = {"Onboarding Ops (Maker)": "Onboarding Ops",
              "Process Ops (DQ & Controls)": "Process Ops",
              "Process Ops (Checker)": "Process Ops",
              "Requestor (Client Service)": "Requestor",
              "Business Approver": "Approver",
              "Integration Layer": "Integration Team",
              "Data Platform": "Data Platform Team",
              "Service Management (ServiceNow Team)": "Service Management Team",
              "Data Steward (Reference Data)": "Steward"}
RACI_ALIASES = {"Integration": "Integration Team", "Platform": "Data Platform Team",
                "SNOW": "Service Management Team", "ServiceNow": "Service Management Team",
                "Data Steward": "Steward", "Business Approver": "Approver",
                "Ops": "Operations Team (unresolved)",
                "Downstream Systems": "Downstream Consumer Team (proposed)",
                "DQ Dashboard": "Reporting Team (proposed)"}
PROPOSED_ORCHESTRATION = "Power Automate (proposed orchestration)"


def normalized_raci(owner, raw_raci):
    source = dict(part.strip().split("=", 1) for part in raw_raci.split(","))
    assignments = {key: RACI_ALIASES.get(value, value) for key, value in source.items()}
    assignments["R"] = ROLE_LANES.get(owner, owner)
    return {"assignments": assignments, "source": source, "duty": source["R"]}


def technology_lane(system):
    if system == PROPOSED_ORCHESTRATION:
        return "Workflow Orchestration"
    if "Azure DevOps Boards" in system or "Power Automate" in system:
        return "Request & Workflow"
    if "Azure Data Lake Storage" in system:
        return "Data Platform"
    if "Purview" in system:
        return "Data Quality"
    if system == "ServiceNow":
        return "ServiceNow"
    if system == "Power BI":
        return "Reporting"
    if "Bloomberg" in system:
        return "External Data / Consumers"
    if any(name in system for name in ("Azure Storage SFTP", "Azure API Management", "Azure Service Bus")):
        return "Integration & Delivery"
    raise ValueError(f"Unmapped source application: {system}")


def element(parent, tag, **attrs):
    prefix, local = tag.split(":")
    return ET.SubElement(parent, f"{{{NS[prefix]}}}{local}", {key: str(value) for key, value in attrs.items()})


def wrapped(text, width=36):
    return "\n".join(textwrap.wrap(text, width=width, break_long_words=False, break_on_hyphens=False))


def intersects(first, second, margin=0):
    left, top, width, height = first
    other_left, other_top, other_width, other_height = second
    return (left < other_left + other_width + margin and left + width + margin > other_left
            and top < other_top + other_height + margin and top + height + margin > other_top)


def prepare_assets():
    assets = OUTPUT / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    for name in ["BPMN20.xsd", "Semantic.xsd", "BPMNDI.xsd", "DC.xsd", "DI.xsd"]:
        destination = assets / name
        if not destination.exists():
            urllib.request.urlretrieve("https://www.omg.org/spec/BPMN/20100501/" + name, destination)
    viewer = assets / "bpmn-navigated-viewer.js"
    if not viewer.exists():
        urllib.request.urlretrieve("https://unpkg.com/bpmn-js@18.3.1/dist/bpmn-navigated-viewer.development.js", viewer)
    return ET.XMLSchema(ET.parse(str(assets / "BPMN20.xsd")))


def make_layout(nodes, combined=False, technology=False):
    top_nodes = [node for node in nodes.values() if not node.parent and not node.attached]
    axis = {node.id: technology_lane(node.system) if technology else ROLE_LANES.get(node.role, node.role) for node in top_nodes}
    lanes = list(dict.fromkeys(axis.values()))
    if technology:
        first_lanes = ["Workflow Orchestration", axis["AOB-013"], axis["AOB-012"]]
        last_lanes = [axis[f"AOB-{number:03d}"] for number in (24, 25, 26)]
        lanes = list(dict.fromkeys(first_lanes + [lane for lane in lanes if lane not in last_lanes] + last_lanes))
        assert len(lanes) == 8
        assert axis["AOB-009"] == axis["AOB-021"] == "Data Platform"
        assert axis["AOB-001"] == axis["AOB-007"] == axis["AOB-029"] == "Request & Workflow"
    else:
        order = [1, 2, 5, 9, 12, 13, 17, 20, 8, 10, 29]
        lanes = list(dict.fromkeys([axis[f"AOB-{number:03d}"] for number in order] + lanes))
        assert axis["AOB-002"] == axis["AOB-019"] == axis["AOB-029"] == "Onboarding Ops"
        assert axis["AOB-003"] == axis["AOB-012"] == axis["AOB-020"] == "Process Ops"
        assert axis["AOB-019"] != axis["AOB-020"]
        assert axis["AOB-008"] == axis["AOB-023"] == "Integration Team"
        assert axis["AOB-009"] == axis["AOB-021"] == "Data Platform Team"
        assert "Integration Layer" not in lanes and "Data Platform" not in lanes
        assert len(lanes) == 10
    bounds = {}
    labels = {}
    lane_bounds = {}
    groups = {}
    cursor = 480
    for lane in lanes:
        by_column = {}
        for node in top_nodes:
            if axis[node.id] == lane:
                by_column.setdefault(node.column, []).append(node)
        slots = max(len(group) for group in by_column.values())
        if "Approval-Wait" in [node.id for group in by_column.values() for node in group]:
            slots = max(slots, 2)
        height = slots * 800
        lane_bounds[lane] = (160, cursor, 40560, height)
        for column, group in by_column.items():
            for slot, node in enumerate(group):
                if technology and node.id == "AOB-014":
                    slot = slots - 1
                left = 400 + column * 1000 + (1200 if column > 5 else 0)
                top = cursor + 240 + slot * 800
                width, node_height = (240, 160) if node.kind.endswith("Task") else (80, 80)
                if node.kind == "subProcess":
                    width, node_height = 1920, 960
                    top = cursor + 160
                bounds[node.id] = (left, top, width, node_height)
                groups[node.id] = ""
                if not node.kind.endswith("Task") and node.kind != "subProcess":
                    labels[node.id] = (left - 80, top - 160, 240, 120)
        cursor += height
    parent_left, parent_top, _, _ = bounds["Approval-Wait"]
    inside = {
        "Approval-Start": (80, 400), "AOB-006": (360, 400),
        "Approval-Received": (1000, 200), "Rejection-Received": (1000, 440),
        "Withdrawal-Received": (1000, 680), "Approval-Complete": (1640, 200),
        "Rejection-Complete": (1640, 440), "Withdrawal-Complete": (1640, 680),
    }
    for identifier, (offset_left, offset_top) in inside.items():
        bounds[identifier] = (parent_left + offset_left, parent_top + offset_top, 80, 80)
        labels[identifier] = (parent_left + offset_left - 80, parent_top + offset_top - 120, 240, 80)
        groups[identifier] = "Approval-Wait"
    for node in nodes.values():
        if node.attached:
            left, top, width, height = bounds[node.attached]
            bounds[node.id] = (left + width - 120, top + height - 40, 80, 80)
            labels[node.id] = (left - 520, top + height + 80, 280, 80)
            groups[node.id] = ""
    return lanes, axis, lane_bounds, bounds, labels, groups, cursor


def route_flows(nodes, flows, bounds, labels, groups, extra_boxes, total_height):
    routes = {}
    edge_labels = {}
    occupied_edges = set()
    static = {**bounds, **{f"Label-{key}": value for key, value in labels.items()}, **extra_boxes}
    max_left = 41000 // 40
    max_top = (total_height + 400) // 40
    blocked_cache = {}

    def blocked_for(parent):
        if parent in blocked_cache:
            return blocked_cache[parent]
        blocked = set()
        for identifier, (left, top, width, height) in static.items():
            base_id = identifier.removeprefix("Label-")
            if parent:
                if base_id == parent or groups.get(base_id) != parent:
                    continue
            elif groups.get(base_id):
                continue
            for grid_left in range(math.floor(left / 40), math.ceil((left + width) / 40) + 1):
                for grid_top in range(math.floor(top / 40), math.ceil((top + height) / 40) + 1):
                    blocked.add((grid_left, grid_top))
        blocked_cache[parent] = blocked
        return blocked

    for flow in sorted(flows, key=lambda item: (not bool(item.parent), item.id)):
        source_left, source_top, source_width, source_height = bounds[flow.source]
        target_left, target_top, _, target_height = bounds[flow.target]
        start_anchor = (source_left + source_width, source_top + source_height // 2)
        end_anchor = (target_left, target_top + (target_height // 80) * 40)
        start = (start_anchor[0] // 40 + 1, start_anchor[1] // 40)
        end = (end_anchor[0] // 40 - 1, end_anchor[1] // 40)
        blocked = blocked_for(flow.parent)
        allowed = {start, end}
        queue = [(0, 0, start[0], start[1], -1)]
        distance = {(start[0], start[1], -1): 0}
        previous = {}
        finish = None
        while queue:
            _, cost, grid_left, grid_top, direction = heapq.heappop(queue)
            state = (grid_left, grid_top, direction)
            if cost != distance.get(state):
                continue
            if (grid_left, grid_top) == end:
                finish = state
                break
            for next_direction, (delta_left, delta_top) in enumerate([(1, 0), (0, 1), (-1, 0), (0, -1)]):
                neighbor = (grid_left + delta_left, grid_top + delta_top)
                if not (4 <= neighbor[0] <= max_left and 10 <= neighbor[1] <= max_top):
                    continue
                if neighbor in blocked and neighbor not in allowed:
                    continue
                if flow.parent:
                    parent_left, parent_top, parent_width, parent_height = bounds[flow.parent]
                    if not (parent_left + 40 <= neighbor[0] * 40 <= parent_left + parent_width - 40
                            and parent_top + 40 <= neighbor[1] * 40 <= parent_top + parent_height - 40):
                        continue
                edge = tuple(sorted(((grid_left, grid_top), neighbor)))
                next_cost = cost + 1 + (3 if direction not in (-1, next_direction) else 0) + (12 if edge in occupied_edges else 0)
                next_state = (*neighbor, next_direction)
                if next_cost >= distance.get(next_state, float("inf")):
                    continue
                distance[next_state] = next_cost
                previous[next_state] = state
                heuristic = abs(neighbor[0] - end[0]) + abs(neighbor[1] - end[1])
                heapq.heappush(queue, (next_cost + heuristic, next_cost, *neighbor, next_direction))
        if finish is None:
            raise ValueError(f"No route for {flow.id}: {flow.source} -> {flow.target}")
        points = []
        state = finish
        while state in previous:
            points.append((state[0] * 40, state[1] * 40))
            predecessor = previous[state]
            occupied_edges.add(tuple(sorted((state[:2], predecessor[:2]))))
            state = predecessor
        points.append((start[0] * 40, start[1] * 40))
        points.reverse()
        points = [start_anchor, *points, end_anchor]
        compact = [points[0]]
        for position in range(1, len(points) - 1):
            before, current, after = points[position - 1:position + 2]
            if not (before[0] == current[0] == after[0] or before[1] == current[1] == after[1]):
                compact.append(current)
        compact.append(points[-1])
        routes[flow.id] = compact
    all_segments = [segment for points in routes.values() for segment in zip(points, points[1:])]

    def line_hits(box, segment):
        (start_left, start_top), (end_left, end_top) = segment
        line_box = (min(start_left, end_left) - 2, min(start_top, end_top) - 2,
                    abs(end_left - start_left) + 4, abs(end_top - start_top) + 4)
        return intersects(box, line_box)

    for flow in sorted(flows, key=lambda item: (not bool(item.parent), item.id)):
        if not flow.label:
            continue
        text = wrapped(flow.label, 32)
        height = max(40, math.ceil((len(text.splitlines()) * 18 + 12) / 20) * 20)
        width = max(80, math.ceil((max(map(len, text.splitlines())) * 8 + 20) / 20) * 20)
        candidates = []
        for start_point, end_point in zip(routes[flow.id], routes[flow.id][1:]):
            if start_point[1] == end_point[1]:
                low, high = sorted((start_point[0], end_point[0]))
                for left in range(low, max(low + 1, high - width + 1), 40):
                    candidates.extend([(left, start_point[1] - height - 20, width, height),
                                       (left, start_point[1] + 20, width, height)])
            else:
                low, high = sorted((start_point[1], end_point[1]))
                for top in range(low, max(low + 1, high - height + 1), 40):
                    candidates.extend([(start_point[0] + 20, top, width, height),
                                       (start_point[0] - width - 20, top, width, height)])
        selected = None
        for candidate in candidates:
            if candidate[0] < 200 or candidate[1] < 480:
                continue
            ignore = {flow.parent} if flow.parent else set()
            if any(intersects(candidate, box, 8) for key, box in static.items() if key not in ignore):
                continue
            if any(intersects(candidate, box, 8) for box in edge_labels.values()):
                continue
            if any(line_hits(candidate, segment) for segment in all_segments):
                continue
            selected = candidate
            break
        if selected is None:
            raise ValueError(f"No nonoverlapping label position: {flow.id} {flow.label}")
        edge_labels[flow.id] = selected
    return routes, edge_labels


def write_diagram(view, nodes, flows, schema):
    technology = view == 2
    combined = view == 3
    titles = {1: "People - Human responsibilities and process", 2: "Technology - Applications and process",
              3: "Combined - People, applications and process"}
    filenames = {1: "diagram1_people", 2: "diagram2_technology", 3: "diagram3_combined"}
    _, _, details, data, apps = read_source()
    lanes, axis, lane_boxes, bounds, labels, groups, height = make_layout(nodes, combined, technology)
    annotations = {}
    data_refs = {}
    associations = []
    for node in nodes.values():
        if not node.kind.endswith("Task"):
            continue
        left, top, _, _ = bounds[node.id]
        if not technology:
            account = "A=" + (node.account or "not specified in source")
            annotations[f"Account-{node.id}"] = (account, (left, top + 240, 280, 80))
            associations.append((node.id, f"Account-{node.id}"))
        if combined or technology:
            proposed = node.id.startswith("AOB-") and not apps.get(node.id) and node.system != PROPOSED_ORCHESTRATION
            system = "System: " + node.system + (" (proposed)" if proposed else "")
            annotations[f"System-{node.id}"] = (system, (left, top + 360, 320, 120))
            associations.append((node.id, f"System-{node.id}"))
        if data.get(node.id):
            identifier = f"BDE-{node.id}"
            data_refs[identifier] = node.id
            bounds[identifier] = (left + 440, top, 80, 80)
            labels[identifier] = (left + 360, top + 120, 280, 120)
            groups[identifier] = ""
            associations.append((node.id, identifier))
    annotations["View-Title"] = (
        f"Sample Process Onboarding (AOB-PR-1001)\nDiagram {view}: {titles[view]}", (400, 40, 1800, 120))
    legend_items = [("Manual", "Proposed hosting documented where source app is absent", "#F6B94F"),
                    ("User", "User task / human with system", "#9ACAF0"),
                    ("Service", "Service task / system executed", "#9DD7AA"),
                    ("Gateway", "Gateways: XOR X / inclusive O / parallel + / event-based", "#FFFFFF"),
                    ("Timer", "Timer: yellow clock", "#FFE275"),
                    ("Exception", "Exception / parked end: red", "#EF9292"),
                    ("Success", "Success end: dark green", "#216E39")]
    if view == 1:
        legend_items = [("Task", "Process activity / responsible human team", "#9ACAF0"), *legend_items[3:]]
    legend_colors = {}
    for index, (key, label, color) in enumerate(legend_items):
        identifier = "Legend-" + key
        annotations[identifier] = (label + "\n" + color, (2400 + index * 800, 40, 680, 160))
        legend_colors[identifier] = color
    extra_boxes = {identifier: box for identifier, (_, box) in annotations.items()}
    routes, edge_labels = route_flows(nodes, flows, bounds, labels, groups, extra_boxes, height)
    definitions = ET.Element(f"{{{NS['bpmn']}}}definitions", nsmap=NS,
                             id=f"Definitions-View-{view}", targetNamespace="urn:onboarding:AOB-PR-1001")
    for identifier in ["Approval-Received", "Rejection-Received", "Withdrawal-Received"]:
        element(definitions, "bpmn:message", id="Message-" + identifier, name=nodes[identifier].name)
    element(definitions, "bpmn:escalation", id="Escalation-Remediation", name="Remediation breach", escalationCode="REMEDIATION_BREACH")
    process = element(definitions, "bpmn:process", id="AOB-PR-1001", name="Sample Process Onboarding", isExecutable="false")
    element(process, "bpmn:documentation").text = (
        "Source: parsed_process_data.json, excluding every row containing [added]. "
        "Descriptive BPMN; no runtime expression bindings invented. See validation.md for open items and approved modelling deviations.")
    lane_set = element(process, "bpmn:laneSet", id=f"LaneSet-{view}")
    lane_ids = {}
    for position, lane in enumerate(lanes, 1):
        lane_id = f"Lane-{view}-{position:02d}"
        lane_ids[lane] = lane_id
        lane_element = element(lane_set, "bpmn:lane", id=lane_id, name=lane)
        if not technology:
            source_roles = sorted({node.role for node in nodes.values() if axis.get(node.id) == lane})
            element(lane_element, "bpmn:documentation").text = (
                "Normalized human responsibility with approved Maker/Checker/Ops team consolidation, "
                "not an individual or headcount. Original owner labels: "
                + "; ".join(source_roles)
                + ". Original and normalized RACI are retained in documentation. Maker and Checker must be different individuals for the same record.")
        else:
            source_systems = sorted({node.system for node in nodes.values() if axis.get(node.id) == lane})
            element(lane_element, "bpmn:documentation").text = (
                "Capability grouping, not product equivalence. Application assignments: "
                + "; ".join(source_systems)
                + ". Proposed orchestration is a modelling assumption, not verified current-state hosting.")
        members = [node.id for node in nodes.values() if not node.parent
                   and (axis.get(node.id) == lane or (node.attached and axis[node.attached] == lane))]
        assert members, lane
        for identifier in members:
            element(lane_element, "bpmn:flowNodeRef").text = identifier
    xml_nodes = {}
    ordered_nodes = sorted(nodes.values(), key=lambda node: bool(node.parent))
    for node in ordered_nodes:
        parent = xml_nodes[node.parent] if node.parent else process
        name = (node.id + "\n" if node.id.startswith("AOB-") else "") + node.name
        if node.id == "AOB-029":
            name += " (success)"
        if node.kind.endswith("Task"):
            name = wrapped(name, 29)
        attributes = {"id": node.id, "name": name}
        if node.kind == "boundaryEvent":
            attributes.update(attachedToRef=node.attached, cancelActivity="true")
        incoming = [flow for flow in flows if flow.target == node.id]
        outgoing = [flow for flow in flows if flow.source == node.id]
        if node.kind.endswith("Gateway"):
            direction = "Mixed" if len(incoming) > 1 and len(outgoing) > 1 else "Diverging" if len(outgoing) > 1 else "Converging"
            attributes["gatewayDirection"] = direction
        node_element = element(parent, "bpmn:" + ("task" if view == 1 and node.kind.endswith("Task") else node.kind), **attributes)
        xml_nodes[node.id] = node_element
        if node.documentation:
            element(node_element, "bpmn:documentation").text = node.documentation
        for flow in incoming:
            element(node_element, "bpmn:incoming").text = flow.id
        for flow in outgoing:
            element(node_element, "bpmn:outgoing").text = flow.id
        if node.kind == "intermediateCatchEvent":
            element(node_element, "bpmn:messageEventDefinition", id="EventDefinition-" + node.id, messageRef="Message-" + node.id)
        if node.kind == "boundaryEvent":
            timer = element(node_element, "bpmn:timerEventDefinition", id="EventDefinition-" + node.id)
            duration = element(timer, "bpmn:timeDuration")
            duration.set(f"{{{NS['xsi']}}}type", "bpmn:tFormalExpression")
            duration.text = node.timer
        if node.kind == "intermediateThrowEvent":
            element(node_element, "bpmn:escalationEventDefinition", id="EventDefinition-" + node.id,
                    escalationRef="Escalation-Remediation")
    for flow in flows:
        parent = xml_nodes[flow.parent] if flow.parent else process
        attributes = {"id": flow.id, "sourceRef": flow.source, "targetRef": flow.target}
        if flow.label:
            attributes["name"] = wrapped(flow.label, 32)
        sequence = element(parent, "bpmn:sequenceFlow", **attributes)
        if flow.condition:
            condition = element(sequence, "bpmn:conditionExpression")
            condition.set(f"{{{NS['xsi']}}}type", "bpmn:tFormalExpression")
            condition.text = flow.condition
    for identifier, step_id in data_refs.items():
        element(process, "bpmn:dataObject", id="DataObject-" + step_id)
        reference = element(process, "bpmn:dataObjectReference", id=identifier, dataObjectRef="DataObject-" + step_id,
                            name=f"{step_id}: {len(data[step_id])} BDE mappings\nSource / target / transformations")
        element(reference, "bpmn:documentation").text = json.dumps(data[step_id], ensure_ascii=False, indent=2)
    for identifier, (text, _) in annotations.items():
        annotation = element(process, "bpmn:textAnnotation", id=identifier)
        element(annotation, "bpmn:text").text = wrapped(text, 44 if identifier.startswith("Legend") else 36)
    for position, (source, target) in enumerate(associations, 1):
        element(process, "bpmn:association", id=f"Association-{position:03d}", sourceRef=source, targetRef=target,
                associationDirection="None")
    collaboration = element(definitions, "bpmn:collaboration", id=f"Collaboration-{view}")
    element(collaboration, "bpmn:participant", id="Pool-AOB-PR-1001", name="Sample Process Onboarding (AOB-PR-1001)", processRef="AOB-PR-1001")
    diagram = element(definitions, "bpmndi:BPMNDiagram", id=f"Diagram-{view}", name=titles[view])
    plane = element(diagram, "bpmndi:BPMNPlane", id=f"Plane-{view}", bpmnElement=f"Collaboration-{view}")

    def shape(identifier, box, fill="#FFFFFF", label=None, **attrs):
        item = element(plane, "bpmndi:BPMNShape", id="Shape-" + identifier, bpmnElement=identifier, **attrs)
        item.set(f"{{{NS['bioc']}}}fill", fill)
        item.set(f"{{{NS['bioc']}}}stroke", "#000000")
        element(item, "dc:Bounds", **dict(zip(("x", "y", "width", "height"), box)))
        if label:
            label_element = element(item, "bpmndi:BPMNLabel")
            element(label_element, "dc:Bounds", **dict(zip(("x", "y", "width", "height"), label)))
        return item

    shape("Pool-AOB-PR-1001", (80, 480, 40640, height - 480), isHorizontal="true")
    for lane, box in lane_boxes.items():
        shape(lane_ids[lane], box, isHorizontal="true")
    for node in ordered_nodes:
        attributes = {}
        if node.kind.endswith("Gateway"):
            attributes["isMarkerVisible"] = "true"
        if node.kind == "subProcess":
            attributes["isExpanded"] = "true"
        fill = COLORS.get(node.kind, "#FFFFFF")
        if view == 1 and node.kind.endswith("Task"):
            fill = COLORS["userTask"]
        if node.kind == "endEvent" and node.parent:
            fill = "#FFFFFF"
        if node.id == "AOB-029":
            fill = "#216E39"
        item = shape(node.id, bounds[node.id], fill, labels.get(node.id), **attributes)
        if node.id == "AOB-029":
            item.set(f"{{{NS['bioc']}}}stroke", "#FFFFFF")
    for identifier in data_refs:
        shape(identifier, bounds[identifier], label=labels[identifier])
    for identifier, (_, box) in annotations.items():
        item = shape(identifier, box, legend_colors.get(identifier, "#FFFFFF"))
        if identifier in legend_colors:
            item.set(f"{{{NS['bioc']}}}stroke", legend_colors[identifier] if identifier != "Legend-Gateway" else "#000000")
    for flow in flows:
        edge = element(plane, "bpmndi:BPMNEdge", id="Edge-" + flow.id, bpmnElement=flow.id)
        for left, top in routes[flow.id]:
            element(edge, "di:waypoint", x=left, y=top)
        if flow.id in edge_labels:
            label_element = element(edge, "bpmndi:BPMNLabel")
            element(label_element, "dc:Bounds", **dict(zip(("x", "y", "width", "height"), edge_labels[flow.id])))
    for position, (source, target) in enumerate(associations, 1):
        edge = element(plane, "bpmndi:BPMNEdge", id=f"Edge-Association-{position:03d}", bpmnElement=f"Association-{position:03d}")
        source_left, source_top, source_width, source_height = bounds[source]
        target_left, target_top, target_width, target_height = extra_boxes.get(target, bounds.get(target))
        if target in data_refs:
            points = [(source_left + source_width // 2, source_top),
                      (source_left + source_width // 2, source_top - 40),
                      (target_left + target_width // 2, source_top - 40),
                      (target_left + target_width // 2, target_top)]
        else:
            points = [(source_left + source_width, source_top + source_height - 40),
                      (source_left + source_width + 80, source_top + source_height - 40),
                      (source_left + source_width + 80, target_top + 40), (target_left + target_width, target_top + 40)]
        for left, top in points:
            element(edge, "di:waypoint", x=left, y=top)
    schema.assertValid(definitions)
    report = verify_geometry(nodes, flows, bounds, labels, extra_boxes, edge_labels, groups, routes, lane_boxes, axis)
    filename = filenames[view]
    destination = OUTPUT / (filename + ".bpmn")
    destination.write_bytes(ET.tostring(definitions, encoding="UTF-8", xml_declaration=True, pretty_print=True))
    report.update(view=view, filename=filename, title=titles[view], flow_nodes=len(nodes), sequence_flows=len(flows),
                  gateways=sum(node.kind.endswith("Gateway") for node in nodes.values()), lanes=len(lanes),
                  data_objects=len(data_refs), annotations=len(annotations), associations=len(associations),
                  shapes=len(plane.findall("bpmndi:BPMNShape", NS)), edges=len(plane.findall("bpmndi:BPMNEdge", NS)),
                  task_types={kind: len(process.findall(".//bpmn:" + kind, NS)) for kind in ["task", "manualTask", "userTask", "serviceTask"]})
    print(f"View {view}: XSD and geometry passed; {report['shapes']} shapes, {report['edges']} edges.")
    return report


def verify_geometry(nodes, flows, bounds, labels, annotations, edge_labels, groups, routes, lane_boxes, axis):
    boxes = {**bounds, **{f"Label-{key}": value for key, value in labels.items()},
             **annotations, **{f"Label-{key}": value for key, value in edge_labels.items()}}
    collisions = []
    for index, (first_id, first_box) in enumerate(boxes.items()):
        for second_id, second_box in list(boxes.items())[index + 1:]:
            first_node = nodes.get(first_id)
            second_node = nodes.get(second_id)
            internal_labels = {"Label-" + flow.id for flow in flows if flow.parent == "Approval-Wait"}
            if first_id == "Approval-Wait" and (groups.get(second_id.removeprefix("Label-")) == first_id or second_id in internal_labels):
                continue
            if second_id == "Approval-Wait" and groups.get(first_id.removeprefix("Label-")) == second_id:
                continue
            if first_node and second_node and (first_node.attached == second_id or second_node.attached == first_id):
                continue
            if intersects(first_box, second_box):
                collisions.append((first_id, second_id))
    assert not collisions, f"Shape/label collisions: {collisions}"
    for identifier, box in bounds.items():
        assert all(value % 20 == 0 for value in box), (identifier, box)
        if identifier in axis:
            left, top, width, height = lane_boxes[axis[identifier]]
            assert left <= box[0] and top <= box[1] and box[0] + box[2] <= left + width and box[1] + box[3] <= top + height
    connector_hits = []
    for flow in flows:
        excluded = {flow.source, flow.target, flow.parent, nodes[flow.source].attached}
        for identifier, box in boxes.items():
            if identifier in excluded:
                continue
            if not flow.parent and groups.get(identifier.removeprefix("Label-")):
                continue
            if flow.parent and identifier == "Approval-Wait":
                continue
            left, top, width, height = box
            for start, end in zip(routes[flow.id], routes[flow.id][1:]):
                if start[0] == end[0]:
                    hit = left < start[0] < left + width and max(min(start[1], end[1]), top) < min(max(start[1], end[1]), top + height)
                else:
                    hit = top < start[1] < top + height and max(min(start[0], end[0]), left) < min(max(start[0], end[0]), left + width)
                if hit:
                    connector_hits.append((flow.id, identifier))
    assert not connector_hits, f"Connectors crossing shapes/labels: {connector_hits}"
    for source, target in [("AOB-004", "AOB-003"), ("Retry-Decision", "Ingest-Merge"),
                           ("Remediation-Decision", "Validation-Merge")]:
        flow = next(flow for flow in flows if flow.source == source and flow.target == target)
        assert any(start[0] > end[0] for start, end in zip(routes[flow.id], routes[flow.id][1:]))
    for identifiers in [("AOB-012", "AOB-013", "AOB-014"), ("AOB-024", "AOB-025", "AOB-026")]:
        positions = sorted(bounds[identifier][1] for identifier in identifiers)
        assert positions[1] - positions[0] == positions[2] - positions[1], (identifiers, positions)
    return {"xsd_valid": True, "shape_label_overlaps": 0, "connector_shape_intersections": 0,
            "grid_valid": True, "nonempty_lanes": True, "backward_loops": True, "parallel_rows_even": True}


def write_raci():
    _, steps, details, _, _ = read_source()
    text = ["# Source RACI And Lane Consolidation", "",
            "Source: ../parsed_process_data.json; rows marked [added] excluded. R = Responsible,",
            "A = Accountable, C = Consulted, I = Informed. Assignments below retain source wording.", "",
            "## Consolidation Decisions", "",
            "- Onboarding Ops (Maker) and Onboarding Ops share the Onboarding Ops lane: the same explicit team name.",
            "  Maker remains the R duty at AOB-002/004/007/019; Ops remains R at AOB-029.",
            "- Process Ops (DQ & Controls) and Process Ops (Checker) share the Process Ops lane: the same explicit team name.",
            "  Checker remains the R duty at AOB-020; Process Ops remains R on the DQ/control steps.",
            "- These are team-level groupings, not proof of individual identity. Maker and Checker must be different",
            "  individuals for the same record under the source four-eye control. Their lanes remain distinct.",
            "- Generic Ops is mapped to Onboarding Ops only at AOB-029, where the owner makes the link explicit.",
            "  Other generic Ops mentions are not assigned to a team. Product Owner is not assumed to be Data Product Owner.",
            "- Ops Lead, DQ Lead, Approver Lead, Tax Lead, Data Owner and other accountable roles are not merged",
            "  with executing teams merely because they supervise or approve their work.",
            "- People and Combined lanes use normalized human responsibilities, with the approved team groupings above.",
            "  Integration Layer maps to Integration Team; Data Platform maps to Data Platform Team. Original owners remain below.",
            "  SNOW and ServiceNow in RACI map to Service Management Team; ServiceNow is the application, not a person.",
            "- Ten responsibility lanes remain; technology capabilities are separate in the Technology view.",
            "  Nine groups own source steps; Ops Lead is the supplemental approval-timeout review lane.",
            "  This is not a staff count. RACI-only stakeholders do not require extra execution lanes.", "",
            "## People Responsibilities", "",
            "| Consolidated lane | Source owner labels | Responsible duties (source R) | Source steps |",
            "|---|---|---|---|"]
    groups = {}
    assignments = []
    for step_id, rows in details.items():
        variants = {}
        assert len({row["Process Step Owner"] for row in rows}) == 1, step_id
        for row in rows:
            key = (row["Process Step Owner"], row["RACI"])
            variants.setdefault(key, []).append(row["Detail Type"])
        for (owner, raw_raci), detail_types in variants.items():
            pairs = [part.strip().split("=", 1) for part in raw_raci.split(",")]
            raci = {key.strip(): value.strip() for key, value in pairs}
            assert len(pairs) == 4 and set(raci) == {"R", "A", "C", "I"}, (step_id, raw_raci)
            lane = ROLE_LANES.get(owner, owner)
            group = groups.setdefault(lane, {"owners": set(), "duties": set(), "steps": set()})
            group["owners"].add(owner)
            group["duties"].add(raci["R"])
            group["steps"].add(step_id)
            assignments.append((step_id, owner, lane, raci, list(dict.fromkeys(detail_types))))
    for lane, group in groups.items():
        text.append("| " + " | ".join([lane, "; ".join(sorted(group["owners"])),
                    "; ".join(sorted(group["duties"])), ", ".join(sorted(group["steps"]))]) + " |")
    text += ["| Ops Lead | Supplemental timeout review | Ops Lead (approved modelling addition) | No separate source step ID |",
             "", "## Process-Step RACI", "",
             "AOB-006 and AOB-023 contain distinct source RACI variants. Both are listed with their detail types;",
             "they are not silently combined into a new assignment. Repeated identical assignments are collapsed.", "",
             "| Step | Process activity | Original owner | Lane | R | A | C | I | Source detail types |",
             "|---|---|---|---|---|---|---|---|---|"]
    for step_id, owner, lane, raci, detail_types in assignments:
        values = [step_id, steps[step_id]["Process Step"], owner, lane,
                  *(raci[key] for key in ("R", "A", "C", "I")), "; ".join(detail_types)]
        text.append("| " + " | ".join(value.replace("|", "\\|") for value in values) + " |")
    assert {assignment[0] for assignment in assignments} == set(steps)
    assert len(assignments) == sum(len({(row["Process Step Owner"], row["RACI"]) for row in rows})
                                   for rows in details.values())
    text += ["", "## RACI Participant Inventory", "",
             "These are exact source labels, including systems and recipients, not unique people.", "",
             "| Assignment | Source labels |", "|---|---|"]
    for responsibility in ("R", "A", "C", "I"):
        labels = sorted({assignment[3][responsibility] for assignment in assignments})
        text.append(f"| {responsibility} | {'; '.join(labels)} |")
    text += ["", "## Participant-Level RACI", "",
             "Each row uses an exact source participant label. Aliases are not merged here; lane grouping is described above.",
             "A step may appear under both C and I where its source detail rows differ; see the process-step table for context.", "",
             "| Source participant | R steps | A steps | C steps | I steps |", "|---|---|---|---|---|"]
    participants = sorted({label for assignment in assignments for label in assignment[3].values()})
    for participant in participants:
        values = [participant]
        for responsibility in ("R", "A", "C", "I"):
            step_ids = sorted({assignment[0] for assignment in assignments
                               if assignment[3][responsibility] == participant})
            values.append(", ".join(step_ids) or "-")
        text.append("| " + " | ".join(values) + " |")
    text += ["", "## Unresolved Source Questions", "",
             "- No person identifiers or staffing roster: shared team names do not prove the same individual.",
             "- Confirm whether the C/I variants at AOB-006 and AOB-023 are intentional detail-specific assignments.",
             "- Resolve generic Ops, Product Owner versus Data Product Owner, and system recipients before headcount analysis.",
             "- The supplemental Ops Lead timeout review has no complete source RACI; A/C/I remain unspecified."]
    (OUTPUT / "source_raci.md").write_text("\n".join(text) + "\n", encoding="utf-8")
    nodes, _ = build_model()
    records = [json.loads(node.documentation) for node in nodes.values() if node.id.startswith("AOB-")]
    assumptions = [
        "Normalized target workflow; proposed assignments require process-owner confirmation.",
        "Source owner/R labels Integration Layer/Integration and Data Platform/Platform denote Integration Team and Data Platform Team in people/RACI views.",
        "SNOW and ServiceNow RACI references denote Service Management Team; the application remains ServiceNow.",
        "Missing source applications use proposed Power Automate orchestration, except technical incident handling (ServiceNow), distribution (existing integration stack), and publication audit (existing master data store). Hosting does not imply automatic execution.",
        "Downstream Systems and DQ Dashboard C/I recipients are proposed Downstream Consumer Team and Reporting Team respectively; generic Ops remains unresolved.",
        "Maker and Checker are distinct duties assigned to different individuals, even when grouped under teams.",
        "Source AOB-006/AOB-023 RACI variants remain separate; no new approver or branch outcome is invented.",
        "Supplemental Ops Lead timeout review retains its approved responsibility; full A/C/I assignments remain unspecified.",
    ]
    (OUTPUT / "normalized_model.json").write_text(json.dumps({"assumptions": assumptions, "steps": records}, indent=2, ensure_ascii=False), encoding="utf-8")
    normalized_text = ["# Normalized Workflow RACI", "", *["- " + assumption for assumption in assumptions], "",
                       "Original assignments: source_raci.md. Source and normalized values: normalized_model.json.", "",
                       "| Step | R team | Source duty | A | C | I | Application | Basis |",
                       "|---|---|---|---|---|---|---|---|"]
    for record in records:
        normalized = record["normalized"]
        for variant in normalized["raci"]:
            raci = variant["assignments"]
            values = [record["step"]["Process Step ID"], raci["R"], variant["duty"], raci["A"], raci["C"], raci["I"], normalized["application"], normalized["application_basis"]]
            normalized_text.append("| " + " | ".join(value.replace("|", "\\|") for value in values) + " |")
    (OUTPUT / "normalized_raci.md").write_text("\n".join(normalized_text) + "\n", encoding="utf-8")
    print(f"RACI verified: {len(steps)} steps, {len(assignments)} distinct source assignments; 10 consolidated lanes.")


PHASES = [
    ("intake", "Intake", 1, 4),
    ("approval", "Approval & Draft", 5, 7),
    ("validation", "Ingestion & Validation", 8, 18),
    ("controls", "Remediation & Checker", 19, 20),
    ("publication", "Publication & Completion", 21, 29),
]


def verify_projection(bounds, labels, routes, edge_labels, flows, nodes, groups):
    boxes = {**bounds, **{f"Label-{key}": value for key, value in labels.items()},
             **{f"Label-{key}": value for key, value in edge_labels.items()}}
    for identifier, box in bounds.items():
        assert all(value % 20 == 0 for value in box), (identifier, box)
    for index, (first_id, first_box) in enumerate(boxes.items()):
        for second_id, second_box in list(boxes.items())[index + 1:]:
            base_first = first_id.removeprefix("Label-")
            base_second = second_id.removeprefix("Label-")
            if groups.get(base_first) == base_second or groups.get(base_second) == base_first:
                continue
            if any(node.attached == first_id and node.id == second_id or
                   node.attached == second_id and node.id == first_id for node in nodes.values()):
                continue
            assert not intersects(first_box, second_box), (first_id, second_id)
    for flow in flows:
        for identifier, box in boxes.items():
            if identifier in {flow.source, flow.target, flow.parent, nodes[flow.source].attached}:
                continue
            if not flow.parent and groups.get(identifier.removeprefix("Label-")):
                continue
            left, top, width, height = box
            for start, end in zip(routes[flow.id], routes[flow.id][1:]):
                assert start[0] == end[0] or start[1] == end[1], flow.id
                if start[0] == end[0]:
                    hit = left < start[0] < left + width and max(min(start[1], end[1]), top) < min(max(start[1], end[1]), top + height)
                else:
                    hit = top < start[1] < top + height and max(min(start[0], end[0]), left) < min(max(start[0], end[0]), left + width)
                assert not hit, (flow.id, identifier)


def write_phase_views(nodes, flows, schema):
    filenames = ["diagram1_people", "diagram2_technology", "diagram3_combined"]
    manifest = {"phases": [], "diagrams": ["overview", *filenames]}
    for phase_id, title, first, last in PHASES:
        members = {node.id for node in nodes.values()
                   if nodes[f"AOB-{first:03d}"].column <= node.column <= nodes[f"AOB-{last:03d}"].column}
        neighbors = {endpoint for flow in flows if flow.source in members or flow.target in members
                     for endpoint in (flow.source, flow.target)}
        selected = members | neighbors
        for identifier in list(selected):
            if nodes[identifier].parent:
                selected.add(nodes[identifier].parent)
            if nodes[identifier].attached:
                selected.add(nodes[identifier].attached)
        selected.update(node.id for node in nodes.values() if node.parent in selected or node.attached in selected)
        subset = {identifier: node for identifier, node in nodes.items() if identifier in selected}
        connections = [flow for flow in flows if flow.source in selected and flow.target in selected]
        entry = {"id": phase_id, "title": title, "first": first, "last": last,
                 "members": sorted(members), "context": sorted(selected - members), "views": {},
                 "validation": {"xsd_valid": True, "geometry_valid": True, "semantic_process_unchanged": True}}
        for view, filename in enumerate(filenames, 1):
            original = ET.parse(str(OUTPUT / (filename + ".bpmn"))).getroot()
            definitions = deepcopy(original)
            plane = definitions.find("bpmndi:BPMNDiagram/bpmndi:BPMNPlane", NS)
            for child in list(plane):
                plane.remove(child)
            lanes, axis, _, original_bounds, _, _, _ = make_layout(nodes, view == 3, view == 2)
            active_lanes = [lane for lane in lanes if any(axis.get(identifier) == lane for identifier in selected)]
            columns = sorted({node.column for node in subset.values() if not node.parent and not node.attached})
            column_left = {}
            cursor = 480
            for column in columns:
                column_left[column] = cursor
                cursor += 2240 if any(node.kind == "subProcess" and node.column == column for node in subset.values()) else 800
            width = cursor + 480
            bounds, labels, groups, lane_boxes = {}, {}, {}, {}
            cursor = 480
            for lane in active_lanes:
                by_column = {}
                for node in subset.values():
                    if axis.get(node.id) == lane:
                        by_column.setdefault(node.column, []).append(node)
                height = max(max(len(group) * 800 for group in by_column.values()),
                             1440 if any(node.kind == "subProcess" for group in by_column.values() for node in group) else 800)
                lane_boxes[lane] = (160, cursor, width - 160, height)
                for column, group in by_column.items():
                    for slot, node in enumerate(group):
                        old = original_bounds[node.id]
                        bounds[node.id] = (column_left[column], cursor + 200 + slot * 800, old[2], old[3])
                        groups[node.id] = ""
                        if not node.kind.endswith("Task") and node.kind != "subProcess":
                            labels[node.id] = (column_left[column] - 80, cursor + 40 + slot * 800, 240, 120)
                cursor += height
            for node in subset.values():
                if node.parent:
                    old, parent_old, parent_new = original_bounds[node.id], original_bounds[node.parent], bounds[node.parent]
                    bounds[node.id] = (parent_new[0] + old[0] - parent_old[0], parent_new[1] + old[1] - parent_old[1], old[2], old[3])
                    labels[node.id] = (bounds[node.id][0] - 80, bounds[node.id][1] - 120, 240, 80)
                    groups[node.id] = node.parent
                if node.attached:
                    left, top, task_width, task_height = bounds[node.attached]
                    bounds[node.id] = (left + task_width - 120, top + task_height - 40, 80, 80)
                    labels[node.id] = (left - 520, top + task_height + 80, 280, 80)
                    groups[node.id] = ""
            for node in subset.values():
                if not node.kind.endswith("Task"):
                    continue
                left, top, _, _ = bounds[node.id]
                if view != 2:
                    bounds["Account-" + node.id] = (left, top + 240, 280, 80)
                    groups["Account-" + node.id] = groups[node.id]
                if view != 1:
                    bounds["System-" + node.id] = (left, top + 360, 320, 120)
                    groups["System-" + node.id] = groups[node.id]
            association_flows = []
            for association in definitions.findall(".//bpmn:association", NS):
                source_id, target_id = association.get("sourceRef"), association.get("targetRef")
                if source_id not in bounds or target_id not in bounds:
                    continue
                association_flows.append(Flow(association.get("id"), source_id, target_id))
            routes, edge_labels = route_flows(subset, connections + association_flows, bounds, labels, groups, {}, cursor)
            groups.update({flow.id: flow.parent for flow in connections if flow.parent})
            verify_projection(bounds, labels, routes, edge_labels, connections + association_flows, subset, groups)
            original_shapes = {shape.get("bpmnElement"): shape for shape in original.findall(".//bpmndi:BPMNShape", NS)}

            def project_shape(identifier, box, label=None):
                shape = deepcopy(original_shapes[identifier])
                shape.find("dc:Bounds", NS).attrib.update(dict(zip(("x", "y", "width", "height"), map(str, box))))
                old_label = shape.find("bpmndi:BPMNLabel", NS)
                if old_label is not None:
                    shape.remove(old_label)
                if label:
                    label_element = element(shape, "bpmndi:BPMNLabel")
                    element(label_element, "dc:Bounds", **dict(zip(("x", "y", "width", "height"), label)))
                plane.append(shape)

            project_shape("Pool-AOB-PR-1001", (80, 480, width - 80, cursor - 480))
            for lane in definitions.findall(".//bpmn:lane", NS):
                if lane.get("name") in lane_boxes:
                    project_shape(lane.get("id"), lane_boxes[lane.get("name")])
            for identifier, box in bounds.items():
                project_shape(identifier, box, labels.get(identifier))
            for flow in connections + association_flows:
                edge = element(plane, "bpmndi:BPMNEdge", id="Edge-" + flow.id, bpmnElement=flow.id)
                for left, top in routes[flow.id]:
                    element(edge, "di:waypoint", x=left, y=top)
                if flow.id in edge_labels:
                    label_element = element(edge, "bpmndi:BPMNLabel")
                    element(label_element, "dc:Bounds", **dict(zip(("x", "y", "width", "height"), edge_labels[flow.id])))
            name = filename + "_" + phase_id
            definitions.find("bpmndi:BPMNDiagram", NS).set("name", title + " - partial DI view with adjacent context")
            assert ET.tostring(definitions.find("bpmn:process", NS)) == ET.tostring(original.find("bpmn:process", NS))
            schema.assertValid(definitions)
            (OUTPUT / (name + ".bpmn")).write_bytes(ET.tostring(definitions, encoding="UTF-8", xml_declaration=True, pretty_print=True))
            entry["views"][filename] = name
            manifest["diagrams"].append(name)
        manifest["phases"].append(entry)
    assert {f"AOB-{number:03d}" for _, _, first, last in PHASES for number in range(first, last + 1)} == {f"AOB-{number:03d}" for number in range(1, 30)}
    (OUTPUT / "navigation.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("15 phase views passed XSD, geometry and unchanged semantic-process checks.")


def write_overview(schema):
    definitions = ET.Element(f"{{{NS['bpmn']}}}definitions", nsmap=NS, id="Overview-Definitions", targetNamespace="urn:onboarding:overview")
    process = element(definitions, "bpmn:process", id="Overview-Process", name="Onboarding - summary abstraction", isExecutable="false")
    element(process, "bpmn:documentation").text = (
        "Non-executable summary abstraction, not a substitute for the authoritative 56-node model. "
        "Collapsed phases have no executable internals here. Remediation and Checker are alternative routes: "
        "issues enter AOB-019 and return to validation; passed validation enters AOB-020. "
        "Checker rejection is unspecified. AOB-014 enrichment dependency remains unresolved.")
    specs = {
        "Overview-Start": ("startEvent", "Request", (240, 560, 80, 80)),
        "intake": ("subProcess", "Intake\nAOB-001 to AOB-004", (480, 520, 320, 160)),
        "approval": ("subProcess", "Approval & Draft\nAOB-005 to AOB-007", (960, 520, 320, 160)),
        "Approval-Result": ("exclusiveGateway", "Approval outcome", (1440, 560, 80, 80)),
        "validation": ("subProcess", "Ingestion & Validation\nAOB-008 to AOB-018", (1680, 520, 320, 160)),
        "Validation-Result": ("exclusiveGateway", "Validation outcome", (2160, 560, 80, 80)),
        "controls": ("subProcess", "Remediation OR Checker\nAOB-019 / AOB-020", (2400, 520, 320, 160)),
        "Controls-Result": ("exclusiveGateway", "Control outcome", (2880, 560, 80, 80)),
        "publication": ("subProcess", "Publication & Completion\nAOB-021 to AOB-029", (3120, 520, 320, 160)),
        "Overview-Success": ("endEvent", "Complete", (3600, 560, 80, 80)),
        "Overview-Rejected": ("endEvent", "Rejected / withdrawn", (1440, 1000, 80, 80)),
        "Overview-Technical": ("endEvent", "Technical parked", (2160, 1000, 80, 80)),
        "Overview-Parked": ("endEvent", "Escalated / parked", (2880, 1000, 80, 80)),
    }
    connections = [
        ("Overview-Start", "intake", ""), ("intake", "approval", ""),
        ("approval", "Approval-Result", ""), ("Approval-Result", "validation", "Approved / resolved"),
        ("Approval-Result", "Overview-Rejected", "Reject / withdraw"),
        ("validation", "Validation-Result", ""), ("Validation-Result", "controls", "Pass / issues"),
        ("Validation-Result", "Overview-Technical", "Retries spent"),
        ("controls", "Controls-Result", ""), ("Controls-Result", "publication", "Checker approved"),
        ("Controls-Result", "validation", "Remediated: revalidate"),
        ("Controls-Result", "Overview-Parked", "Attempt 3 / SLA breach"),
        ("publication", "Overview-Success", ""),
    ]
    compact_boxes = {
        "Overview-Start": (40, 140, 40, 40), "intake": (160, 100, 240, 120),
        "approval": (480, 100, 240, 120), "Approval-Result": (800, 140, 40, 40),
        "validation": (960, 100, 240, 120), "Validation-Result": (1060, 300, 40, 40),
        "controls": (960, 460, 240, 120), "Controls-Result": (800, 500, 40, 40),
        "publication": (480, 460, 240, 120), "Overview-Success": (320, 500, 40, 40),
        "Overview-Rejected": (800, 300, 40, 40), "Overview-Technical": (1260, 300, 40, 40),
        "Overview-Parked": (800, 680, 40, 40),
    }
    specs = {identifier: (kind, title if not kind.endswith("Gateway") else "", compact_boxes[identifier])
             for identifier, (kind, title, _) in specs.items()}
    nodes = {identifier: Node(identifier, kind, title, "", "", 0) for identifier, (kind, title, _) in specs.items()}
    flows = [Flow(f"Overview-Flow-{index:02d}", source, target, label) for index, (source, target, label) in enumerate(connections, 1)]
    bounds = {identifier: spec[2] for identifier, spec in specs.items()}
    labels = {"Overview-Start": (20, 60, 120, 60), "Overview-Success": (200, 560, 200, 60),
              "Overview-Rejected": (740, 340, 160, 60), "Overview-Technical": (1200, 360, 200, 60),
              "Overview-Parked": (860, 680, 200, 60)}
    groups = {identifier: "" for identifier in specs}
    points = [
        [(80, 160), (160, 160)], [(400, 160), (480, 160)], [(720, 160), (800, 160)],
        [(840, 160), (960, 160)], [(820, 180), (820, 300)], [(1080, 220), (1080, 300)],
        [(1080, 340), (1080, 460)], [(1100, 320), (1260, 320)], [(960, 520), (840, 520)],
        [(800, 520), (720, 520)],
        [(820, 500), (820, 420), (440, 420), (440, 20), (1080, 20), (1080, 100)],
        [(820, 540), (820, 680)], [(480, 520), (360, 520)],
    ]
    routes = {flow.id: route for flow, route in zip(flows, points)}
    edge_labels = {"Overview-Flow-04": (840, 180, 120, 100), "Overview-Flow-05": (620, 240, 180, 40),
                   "Overview-Flow-07": (1100, 420, 260, 40), "Overview-Flow-08": (1120, 240, 240, 60),
                   "Overview-Flow-10": (480, 600, 240, 40), "Overview-Flow-11": (460, 320, 260, 80),
                   "Overview-Flow-12": (840, 600, 220, 60)}
    verify_projection(bounds, labels, routes, edge_labels, flows, nodes, groups)
    for identifier, node in nodes.items():
        attrs = {"gatewayDirection": "Diverging"} if node.kind.endswith("Gateway") else {}
        item = element(process, "bpmn:" + node.kind, id=identifier, name=node.name, **attrs)
        if identifier in {phase[0] for phase in PHASES}:
            phase = next(phase for phase in PHASES if phase[0] == identifier)
            element(item, "bpmn:documentation").text = json.dumps({"phase": identifier, "first": phase[2], "last": phase[3], "summary_only": True})
        for flow in flows:
            if flow.target == identifier:
                element(item, "bpmn:incoming").text = flow.id
        for flow in flows:
            if flow.source == identifier:
                element(item, "bpmn:outgoing").text = flow.id
    for flow in flows:
        sequence = element(process, "bpmn:sequenceFlow", id=flow.id, sourceRef=flow.source, targetRef=flow.target, name=wrapped(flow.label, 32))
        if nodes[flow.source].kind.endswith("Gateway"):
            condition = element(sequence, "bpmn:conditionExpression")
            condition.set(f"{{{NS['xsi']}}}type", "bpmn:tFormalExpression")
            condition.text = flow.label
    diagram = element(definitions, "bpmndi:BPMNDiagram", id="Overview-Diagram")
    plane = element(diagram, "bpmndi:BPMNPlane", id="Overview-Plane", bpmnElement="Overview-Process")
    for identifier, box in bounds.items():
        attrs = {"isExpanded": "false"} if nodes[identifier].kind == "subProcess" else {}
        shape = element(plane, "bpmndi:BPMNShape", id="Shape-" + identifier, bpmnElement=identifier, **attrs)
        fill = "#216E39" if identifier == "Overview-Success" else "#EF9292" if nodes[identifier].kind == "endEvent" else "#FFFFFF"
        shape.set(f"{{{NS['bioc']}}}fill", fill)
        shape.set(f"{{{NS['bioc']}}}stroke", "#FFFFFF" if identifier == "Overview-Success" else "#000000")
        element(shape, "dc:Bounds", **dict(zip(("x", "y", "width", "height"), box)))
        if identifier in labels:
            label_element = element(shape, "bpmndi:BPMNLabel")
            element(label_element, "dc:Bounds", **dict(zip(("x", "y", "width", "height"), labels[identifier])))
    for flow in flows:
        edge = element(plane, "bpmndi:BPMNEdge", id="Edge-" + flow.id, bpmnElement=flow.id)
        for left, top in routes[flow.id]:
            element(edge, "di:waypoint", x=left, y=top)
        if flow.id in edge_labels:
            label_element = element(edge, "bpmndi:BPMNLabel")
            element(label_element, "dc:Bounds", **dict(zip(("x", "y", "width", "height"), edge_labels[flow.id])))
    schema.assertValid(definitions)
    (OUTPUT / "overview.bpmn").write_bytes(ET.tostring(definitions, encoding="UTF-8", xml_declaration=True, pretty_print=True))
    print("Overview passed XSD and geometry checks; 5 summary subprocesses.")


def write_notes(reports):
    tables, steps, details, data, apps = read_source()
    write_raci()
    text = ["# Sample Process Onboarding (AOB-PR-1001)", "", "## Deliverables", "",
            "All three views share one control-flow model. Each XML contains a single process pool,",
            "the same 29 source step IDs, full BPMN DI, and embedded source documentation.", "",
            "| View | BPMN | SVG | Flow nodes | Gateways | Sequence flows | Lanes |",
            "|---|---|---|---:|---:|---:|---:|"]
    for report in reports:
        filename = report["filename"]
        text.append(f"| {report['title']} | [{filename}.bpmn]({filename}.bpmn) | [{filename}.svg]({filename}.svg) | {report['flow_nodes']} | {report['gateways']} | {report['sequence_flows']} | {report['lanes']} |")
    text += ["", "## Overview And Phase Views", "",
             "[Interactive viewer](renderer.html) | [Overview BPMN](overview.bpmn) | [Overview SVG](overview.svg)", "",
             "The five collapsed overview subprocesses are a non-executable summary abstraction, not executable definitions.",
             "Pass enters Checker (AOB-020); issues enter Remediation (AOB-019). These are alternative paths,",
             "not a requirement to remediate every case. Corrected records return to validation. Approval resolved",
             "includes the authorized timeout-review route. Retry exhaustion and remediation breach remain terminal outcomes.",
             "Detailed diagrams remain authoritative for retry counts, timers, parallel branches and source conditions.", "",
             "Each phase file retains the full original process XML unchanged, but contains partial DI showing the phase",
             "and adjacent boundary context. It is a projection, not a standalone executable subprocess. Hidden nodes",
             "and flows remain in the XML; missing boundary connectors in the picture do not imply process completion.",
             "Phase DI retains responsibility annotations for People/Combined and application annotations for Technology/Combined.",
             "BDE objects are omitted from phase DI only; full-view DI and source documentation retain them.",
             "The viewer opens detailed views at their first task at readable zoom; Fit all shows the entire projection.",
             "The overview fits the available screen; the phase selector provides access to all phases.", "",
             "| Phase | Steps | People BPMN / SVG | Technology BPMN / SVG | Combined BPMN / SVG |",
             "|---|---|---|---|---|"]
    for phase_id, title, first, last in PHASES:
        links = []
        for report in reports:
            name = report["filename"] + "_" + phase_id
            links.append(f"[BPMN]({name}.bpmn) / [SVG]({name}.svg)")
        text.append(f"| {title} | AOB-{first:03d} to AOB-{last:03d} | " + " | ".join(links) + " |")
    text += ["", "## Technology Capabilities", "",
             "Eight capability lanes consolidate tools without asserting that different products are the same system.",
             "Source application strings are preserved. Missing application assignments are explicitly proposed, not verified hosting.", "",
             "| Capability lane | Source or proposed application assignments |", "|---|---|"]
    capability_systems = {}
    for node in build_model()[0].values():
        capability_systems.setdefault(technology_lane(node.system), set()).add(node.system)
    for lane, systems in capability_systems.items():
        text.append("| " + lane + " | " + "; ".join(sorted(systems)) + " |")
    text += ["", "## Verification", "",
             "- XML validated using the official OMG BPMN20.xsd and its imported schemas.",
             "- Source IDs AOB-001 through AOB-029 occur exactly once per view.",
             "- Every task/subprocess has one incoming and one outgoing sequence flow.",
             "- Every gateway exit is labelled; event-based exits lead to message catch events.",
             "- Every boundary timer attaches to an activity, not a gateway.",
             "- No sequence flow crosses process/subprocess scope or the pool boundary.",
             "- Geometry checks cover shape/label overlap, connector/shape intersections, 20px grid,",
             "  nonempty lanes, lane containment, backward loop routing, and evenly spaced parallel task rows.",
             "- Intentional containment (pool/lane/subprocess) and timer attachment are not collisions.",
             "- Cross-lane connectors may cross other connectors; such crossings are not BPMN junctions.",
             "- See render_validation.json for actual bpmn-js import/export and rendered bounds checks.",
             "- Models are descriptive (isExecutable=false). Natural-language conditions preserve source meaning;",
             "  no engine-specific variables, retry implementation, or runtime expression bindings are invented.", "",
             "## Source And Approved Decisions", "",
             "Source: ../parsed_process_data.json. User confirmed exclusion of every row containing [added].",
             f"Remaining table sizes: {', '.join(f'{name}: {len(rows)}' for name, rows in tables.items())}.",
             "The original file is preserved. Existing BPMN/draw.io files are also unchanged.", "",
             "- User approved an expanded approval-wait subprocess enclosing event-based gateway AOB-006,",
             "  with an interrupting PT24H boundary timer. Approve/Reject/Withdraw are competing message catches.",
             "  Subprocess outcomes route through an explicit XOR; reject/withdraw ends the case.",
             "- The timeout goes to the explicitly requested Ops Lead ServiceNow review, then AOB-007 after resolution.",
             "  Its accountable party is not specified and is labelled as an open item.",
             "- User approved immediate parking after escalation for an AOB-019 SLA breach.",
             "  The timer represents urgent=4h/standard=24h; attempt exhaustion uses a separate XOR, not a timer.",
             "- User approved omitting unused lanes, retaining explicit R owners, and consolidating technology into",
             "  eight capability lanes. Composite source system strings remain intact; no arbitrary primary tool was selected.",
             "- People/Combined lanes use normalized human teams: Integration Team, Data Platform Team and Service Management Team.",
             "  SNOW and ServiceNow RACI references both map to Service Management Team; ServiceNow remains the application.",
             "  Original owners and full source RACI remain in task documentation and source_raci.md.",
             "  See [normalized_raci.md](normalized_raci.md) and [normalized_model.json](normalized_model.json) for adjusted assignments and assumptions.",
             "- People/Combined lanes consolidate Onboarding Ops with Maker, and Process Ops DQ/Controls with Checker.",
             "  Maker and Checker remain distinct duties; shared lanes identify teams, not individual staff.",
             "  See [source_raci.md](source_raci.md) for all 29 steps, both source variants, and consolidation evidence.",
             "- No Power BI Service lane is fabricated: the retained source says Power BI only.",
             "- People uses generic BPMN tasks and uniform task color, without application or execution-type annotations.",
             "  Technology uses capability lanes and application annotations; Combined uses human lanes plus application annotations.",
             "- Missing application rows do not prove manual execution. Proposed hosting uses Power Automate orchestration,",
             "  except AOB-010 (ServiceNow), AOB-023 (the existing integration stack), and AOB-027 (the master data store).",
             "  All proposals require confirmation. Hosting does not imply automatic execution.",
             "- Technology/Combined use service tasks for source-backed integration/platform execution and user tasks otherwise.",
             "  Task types are descriptive assumptions; AOB-012/013 remain user tasks based on their human R owners.",
             "- AOB-001 and AOB-029 are the requested start/success end events; their original task descriptions",
             "  and BDE transformations are retained in documentation, not converted into hidden executable work.",
             "- Supplemental merge gateways preserve the requested one-in/one-out task degree.",
             "  AOB-023 remains a source step followed by a structural AND split; an AND join precedes AOB-027.",
             "- Retry <=2 means next retry number <=2, so at most two retries are allowed.",
             "- Loop/SLA rows do not imply an additional intermediate delay. Timers are represented once,",
             "  by the approved boundary events, to avoid inventing waits or delaying remediation.", "",
             "## Open Data Items", "",
             "No Application row: " + ", ".join(step_id for step_id, values in apps.items() if not values) + ".", "",
             "No PSDATA row: " + ", ".join(step_id for step_id, values in data.items() if not values) + ".", "",
             "These steps have no BDE data-object annotation. Data objects for mapped tasks carry all source/target",
             "and transformation rows in documentation. Mapped gateways/events retain them in their own documentation.", "",
             "AOB-020 specifies checker approval before publication, but no rejected-checker destination; none is invented.",
             "The rejection outcome remains a source-data open item. Publication is labelled 'Checker approval required'.", "",
             "AOB-014 consumes 'Enriched Record' in its step row, but the prescribed AND split runs it concurrently",
             "with enrichment AOB-013. The control flow follows the explicit requirement; the data dependency needs clarification.", "",
             "Application strings with '/' or chained systems are retained within capability lanes. Whether they represent",
             "alternatives, transport hops, or multiple executors is not resolved by the source.", "",
             "SLA duration selection and exception/approval persistence are descriptive, not deployment-ready expressions.", "",
             "## Step Traceability", "", "| ID | Step | Owner | RACI | Application |", "|---|---|---|---|---|"]
    for step_id, step in steps.items():
        source_raci = " / ".join(dict.fromkeys(row["RACI"] for row in details[step_id]))
        values = [step_id, step["Process Step"], details[step_id][0]["Process Step Owner"], source_raci,
                  " / ".join(apps[step_id]) or "OPEN: no Application row"]
        text.append("| " + " | ".join(value.replace("|", "\\|") for value in values) + " |")
    text += ["", "## Source BDE Mappings", "", "| Step | PSDATA ID | Source/Target | BDE | Transformation |",
             "|---|---|---|---|---|"]
    for step_id, rows in data.items():
        for row in rows:
            values = [step_id, row["PSDATA ID"], row["Src/Tgt"], row["BDE Name"], row["Data Transformation Logic"]]
            text.append("| " + " | ".join(value.replace("|", "\\|") for value in values) + " |")
    (OUTPUT / "validation.md").write_text("\n".join(text) + "\n", encoding="utf-8")


def serve(port):
    class RendererHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(OUTPUT), **kwargs)

        def do_POST(self):
            manifest = json.loads((OUTPUT / "navigation.json").read_text(encoding="utf-8"))
            allowed = {name + ".svg" for name in manifest["diagrams"]} | {"render_validation.json"}
            filename = self.path.removeprefix("/save/")
            if not self.path.startswith("/save/") or filename not in allowed:
                self.send_error(404)
                return
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length < 10000000:
                self.send_error(413)
                return
            payload = self.rfile.read(length)
            if filename.endswith(".svg"):
                assert ET.fromstring(payload).tag == "{http://www.w3.org/2000/svg}svg"
            else:
                json.loads(payload)
            (OUTPUT / filename).write_bytes(payload)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"saved")

    print(f"Renderer: http://127.0.0.1:{port}/renderer.html", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), RendererHandler).serve_forever()


@dataclass
class Node:
    id: str
    kind: str
    name: str
    role: str
    system: str
    column: int
    parent: str = ""
    documentation: str = ""
    attached: str = ""
    timer: str = ""
    account: str = ""


@dataclass
class Flow:
    id: str
    source: str
    target: str
    label: str = ""
    condition: str = ""
    parent: str = ""


def build_model():
    tables, steps, details, data, apps = read_source()
    nodes = {}
    flows = []
    columns = [0, 1, 2, 3, 4, 5, 9, 10, 12, 14, 17, 18, 18, 18,
               19, 20, 21, 23, 25, 28, 29, 30, 31, 33, 33, 33, 35, 36, 37]
    kinds = {1: "startEvent", 3: "exclusiveGateway", 6: "eventBasedGateway",
             11: "parallelGateway", 15: "parallelGateway", 16: "inclusiveGateway",
             18: "exclusiveGateway", 29: "endEvent"}
    proposed_apps = {"AOB-010": "ServiceNow", "AOB-023": " / ".join(apps["AOB-008"]),
                     "AOB-027": " / ".join(apps["AOB-021"])}
    for number, column in enumerate(columns, 1):
        step_id = f"AOB-{number:03d}"
        owner = details[step_id][0]["Process Step Owner"]
        raci = details[step_id][0]["RACI"]
        approved_duties = {"Maker": "Onboarding Ops", "Checker": "Process Ops", "Ops": "Onboarding Ops"}
        for detail in details[step_id]:
            responsible = next(part.strip()[2:] for part in detail["RACI"].split(",") if part.strip().startswith("R="))
            assert ROLE_LANES.get(owner, owner) == approved_duties.get(responsible, RACI_ALIASES.get(responsible, responsible)), (step_id, owner, responsible)
        accountable = next(part.strip()[2:] for part in raci.split(",") if part.strip().startswith("A="))
        system = " / ".join(apps[step_id]) or proposed_apps.get(step_id, PROPOSED_ORCHESTRATION)
        automated = owner in {"Integration Layer", "Data Platform"}
        kind = kinds.get(number, "serviceTask" if automated and apps[step_id] else "userTask")
        normalized = {"team": ROLE_LANES.get(owner, owner), "application": system,
                  "application_basis": "source" if apps[step_id] else "proposed; confirmation required",
                  "raci": [normalized_raci(owner, value) for value in dict.fromkeys(detail["RACI"] for detail in details[step_id])]}
        documentation = json.dumps({"step": steps[step_id], "details": details[step_id],
                        "BDE mappings": data[step_id], "normalized": normalized}, ensure_ascii=False, indent=2)
        nodes[step_id] = Node(step_id, kind, steps[step_id]["Process Step"], owner,
                              system, column, documentation=documentation, account=accountable)
    maker = nodes["AOB-019"].role
    platform = nodes["AOB-009"].role
    integration = nodes["AOB-023"].role
    approver = nodes["AOB-006"].role
    manual = PROPOSED_ORCHESTRATION

    def add(identifier, kind, name, role, system, column, **kwargs):
        nodes[identifier] = Node(identifier, kind, name, role, system, column, **kwargs)

    def flow(source, target, label="", condition="", parent=""):
        flows.append(Flow(f"Flow-{len(flows) + 1:03d}", source, target, label, condition, parent))

    add("Approval-Wait", "subProcess", "Approval wait", approver, manual, 5)
    nodes["AOB-006"].parent = "Approval-Wait"
    for identifier, kind, name in [
        ("Approval-Start", "startEvent", "Await outcome"),
        ("Approval-Received", "intermediateCatchEvent", "Approve"),
        ("Rejection-Received", "intermediateCatchEvent", "Reject"),
        ("Withdrawal-Received", "intermediateCatchEvent", "Withdraw"),
        ("Approval-Complete", "endEvent", "Approved outcome"),
        ("Rejection-Complete", "endEvent", "Rejected outcome"),
        ("Withdrawal-Complete", "endEvent", "Withdrawn outcome"),
    ]:
        add(identifier, kind, name, approver, manual, 5, parent="Approval-Wait")
    add("Approval-Timeout", "boundaryEvent", "24h approval timeout", approver, manual, 5,
        attached="Approval-Wait", timer="PT24H")
    add("Approval-Outcome", "exclusiveGateway", "Approval outcome", approver, manual, 7)
    add("Approval-Escalation", "userTask", "Ops Lead review / resolve incident",
        "Ops Lead", "ServiceNow", 7, documentation="Explicit timeout resolution step requested by user.")
    add("Request-Rejected", "endEvent", "Request Rejected/Withdrawn", approver, manual, 8)
    for identifier, name, role, system, column in [
        ("Draft-Merge", "Approved or timeout resolved", nodes["AOB-007"].role, nodes["AOB-007"].system, 8),
        ("Ingest-Merge", "Initial ingestion or retry", platform, nodes["AOB-009"].system, 11),
        ("Ingest-Outcome", "Schema validation outcome", platform, nodes["AOB-009"].system, 13),
        ("Retry-Decision", "Retry allowance", nodes["AOB-010"].role, manual, 15),
        ("Validation-Merge", "Initial or corrected draft", platform, manual, 16),
        ("Specialist-Outcome", "SPECIALIST outcome", nodes["AOB-017"].role, manual, 22),
        ("Remediation-Merge", "Remediation required", maker, manual, 24),
        ("Remediation-Decision", "Remediation attempt count", maker, manual, 26),
        ("Breach-Merge", "Attempt or SLA breach", maker, manual, 27),
    ]:
        add(identifier, "exclusiveGateway", name, role, system, column)
    add("Technical-Parked", "endEvent", "Parked - Technical", nodes["AOB-010"].role, manual, 16)
    add("Remediation-Timer", "boundaryEvent", "SLA: urgent 4h / standard 24h", maker, manual, 25,
        attached="AOB-019", timer="if Urgency = 'urgent' then 'PT4H' else 'PT24H'")
    add("Remediation-Escalation", "intermediateThrowEvent", "Escalate remediation breach", maker, manual, 28)
    add("Remediation-Parked", "endEvent", "Parked - Remediation Exhausted", maker, manual, 29)
    add("Delivery-Split", "parallelGateway", "Parallel downstream delivery", integration, manual, 32)
    add("Delivery-Join", "parallelGateway", "Delivery outcomes recorded", platform, manual, 34)
    flow("AOB-001", "AOB-002")
    flow("AOB-002", "AOB-003")
    flow("AOB-003", "AOB-004", "FAIL: mandatory attribute/evidence missing", "mandatory attribute/evidence missing")
    flow("AOB-004", "AOB-003", "Clarification supplied: recheck completeness")
    flow("AOB-003", "AOB-005", "PASS: else (no mandatory attribute/evidence missing)", "not (mandatory attribute/evidence missing)")
    flow("AOB-005", "Approval-Wait")
    flow("Approval-Start", "AOB-006", parent="Approval-Wait")
    for event, end, label in [("Approval-Received", "Approval-Complete", "Approve"),
                              ("Rejection-Received", "Rejection-Complete", "Reject"),
                              ("Withdrawal-Received", "Withdrawal-Complete", "Withdraw")]:
        flow("AOB-006", event, label, parent="Approval-Wait")
        flow(event, end, parent="Approval-Wait")
    flow("Approval-Wait", "Approval-Outcome")
    flow("Approval-Outcome", "Draft-Merge", "Approve", "Approval Outcome = Approve")
    flow("Approval-Outcome", "Request-Rejected", "Reject/Withdraw", "Approval Outcome = Reject OR Approval Outcome = Withdraw")
    flow("Approval-Timeout", "Approval-Escalation", "Timeout (24h): ServiceNow incident + escalation to Ops Lead")
    flow("Approval-Escalation", "Draft-Merge", "Ops Lead review resolved")
    flow("Draft-Merge", "AOB-007", "Continue with approved/resolved request")
    flow("AOB-007", "AOB-008")
    flow("AOB-008", "Ingest-Merge")
    flow("Ingest-Merge", "AOB-009", "Ingest package")
    flow("AOB-009", "Ingest-Outcome")
    flow("Ingest-Outcome", "Validation-Merge", "Schema Validation Status = PASS", "Schema Validation Status = PASS")
    flow("Ingest-Outcome", "AOB-010", "Schema Validation Status = FAIL", "Schema Validation Status = FAIL")
    flow("AOB-010", "Retry-Decision")
    flow("Retry-Decision", "Ingest-Merge", "Retry <=2 (next retry number <=2)", "next retry number <= 2")
    flow("Retry-Decision", "Technical-Parked", "Else: retries exhausted (next retry number >2)", "next retry number > 2")
    flow("Validation-Merge", "AOB-011", "Validate initial/corrected draft")
    for step_id, label in [("AOB-012", "DQ ruleset"), ("AOB-013", "Reference enrichment"), ("AOB-014", "Duplicate detection")]:
        flow("AOB-011", step_id, "Spawn in parallel: " + label)
        flow(step_id, "AOB-015")
    flow("AOB-015", "AOB-016", "All three validation branches complete")
    flow("AOB-016", "AOB-017", "Tax Review Basis=TRUE", "Tax Review Basis = TRUE")
    flow("AOB-016", "AOB-018", "Else: Tax Review Basis=FALSE", "Tax Review Basis = FALSE")
    flow("AOB-017", "Specialist-Outcome")
    flow("Specialist-Outcome", "AOB-018", "Approved", "Specialist Review Outcome = Approved")
    flow("Specialist-Outcome", "Remediation-Merge", "Correction Required", "Specialist Review Outcome = Correction Required")
    flow("AOB-018", "Remediation-Merge", "FAIL: DQ/Merge/Specialist require remediation", "DQ fail OR Merge remediation OR Specialist correction")
    flow("AOB-018", "AOB-020", "PASS: else (DQ/Merge/Specialist do not require remediation)", "not (DQ fail OR Merge remediation OR Specialist correction)")
    flow("Remediation-Merge", "AOB-019", "Correct failed fields")
    flow("AOB-019", "Remediation-Decision")
    flow("Remediation-Decision", "Validation-Merge", "Attempt <3: loop to AOB-011", "Remediation Attempt Count < 3")
    flow("Remediation-Decision", "Breach-Merge", "Attempt =3: max 3 attempts reached", "Remediation Attempt Count = 3")
    flow("Remediation-Timer", "Breach-Merge", "SLA breach: urgent 4h / standard 24h")
    flow("Breach-Merge", "Remediation-Escalation", "Escalate breach")
    flow("Remediation-Escalation", "Remediation-Parked")
    for number in range(20, 23):
        flow(f"AOB-{number:03d}", f"AOB-{number + 1:03d}", "Checker approval required" if number == 20 else "")
    flow("AOB-023", "Delivery-Split")
    for number in range(24, 27):
        flow("Delivery-Split", f"AOB-{number:03d}", f"Parallel delivery: {steps[f'AOB-{number:03d}']['Process Step']}")
        flow(f"AOB-{number:03d}", "Delivery-Join", "Update Consumer Delivery Status independently")
    flow("Delivery-Join", "AOB-027", "All delivery outcomes available")
    flow("AOB-027", "AOB-028")
    flow("AOB-028", "AOB-029")
    return nodes, flows


def verify_model(nodes, flows):
    assert len({flow.id for flow in flows}) == len(flows)
    for flow in flows:
        assert nodes[flow.source].parent == flow.parent == nodes[flow.target].parent, flow
    for node in nodes.values():
        incoming = [flow for flow in flows if flow.target == node.id]
        outgoing = [flow for flow in flows if flow.source == node.id]
        if node.kind.endswith("Task") or node.kind == "subProcess":
            assert len(incoming) == len(outgoing) == 1, node.id
        if node.kind.endswith("Gateway"):
            assert all(flow.label for flow in outgoing), node.id
        if node.kind == "eventBasedGateway":
            assert all(nodes[flow.target].kind == "intermediateCatchEvent" for flow in outgoing)
        if node.kind == "boundaryEvent":
            assert nodes[node.attached].kind in {"subProcess", "manualTask", "userTask"}
        if node.kind == "startEvent":
            assert not incoming and len(outgoing) == 1
        if node.kind == "endEvent":
            assert incoming and not outgoing
    pairs = {(flow.source, flow.target) for flow in flows}
    assert ("AOB-004", "AOB-003") in pairs
    assert ("Retry-Decision", "Ingest-Merge") in pairs
    assert ("Remediation-Decision", "Validation-Merge") in pairs
    assert nodes["AOB-016"].kind == "inclusiveGateway"
    print(f"Shared model checks passed: {len(nodes)} flow nodes, {len(flows)} sequence flows.")


def clean(value):
    text = str(value).strip()
    try:
        text = text.encode("cp1252").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        pass
    return text


def read_source():
    raw = json.loads((ROOT / "parsed_process_data.json").read_text(encoding="utf-8-sig"))
    tables = {
        name: [{key: clean(value) for key, value in row.items()} for row in rows
               if not any("[added]" in str(value).lower() for value in row.values())]
        for name, rows in raw.items()
    }
    steps = {row["Process Step ID"]: row for row in tables["Process Step"]}
    details = {
        step_id: [row for row in tables["Process Step Detail"]
                  if row["Process Step ID"] == step_id]
        for step_id in steps
    }
    data = {
        step_id: [row for row in tables["Process Ste Data"]
                  if row["Process Step ID"] == step_id]
        for step_id in steps
    }
    apps = {
        step_id: [row["Detail Value"] for row in rows
                  if row["Detail Type"].endswith("/ Application")]
        for step_id, rows in details.items()
    }
    return tables, steps, details, data, apps


def verify_source():
    tables, steps, details, data, apps = read_source()
    assert set(steps) == {f"AOB-{number:03d}" for number in range(1, 30)}
    assert all(details.values())
    assert not apps["AOB-004"] and not apps["AOB-019"]
    assert "AOB-003" in steps["AOB-004"]["Description"]
    assert any("Inclusive" in row["Detail Type"] for row in details["AOB-016"])
    print("Source checks passed; added rows excluded.")
    print("Table counts:", {name: len(rows) for name, rows in tables.items()})
    print("No Application:", ", ".join(key for key, value in apps.items() if not value))
    print("No PSDATA:", ", ".join(key for key, value in data.items() if not value) or "none")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate", action="store_true")
    parser.add_argument("--serve", type=int)
    arguments = parser.parse_args()
    verify_source()
    verify_model(*build_model())
    if arguments.generate:
        schema = prepare_assets()
        nodes, flows = build_model()
        reports = [write_diagram(view, nodes, flows, schema) for view in (1, 2, 3)]
        write_overview(schema)
        write_phase_views(nodes, flows, schema)
        (OUTPUT / "validation.json").write_text(json.dumps(reports, indent=2), encoding="utf-8")
        write_notes(reports)
    if arguments.serve:
        serve(arguments.serve)