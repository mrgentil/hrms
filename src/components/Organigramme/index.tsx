'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeMouseHandler,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { orgchartService, OrgChartNode } from '@/services/orgchart.service';
import { useToast } from '@/hooks/useToast';

interface EmployeeNodeData {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  profile_photo_url: string | null;
  work_email: string | null;
}

const EmployeeNode = ({ data }: { data: EmployeeNodeData }) => {
  const initials = data.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-primary/20 hover:border-primary/50 transition-all cursor-pointer min-w-[180px] p-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {data.profile_photo_url ? (
            <img
              src={data.profile_photo_url}
              alt={data.full_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {data.full_name}
          </h4>
          {data.position && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {data.position}
            </p>
          )}
          {data.department && (
            <p className="text-xs text-primary/70 truncate">{data.department}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  employee: EmployeeNode,
};

export default function Organigramme() {
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<OrgChartNode[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const toast = useToast();

  const convertToFlowElements = useCallback(
    (
      data: OrgChartNode[],
      parentId: string | null = null,
      level: number = 0,
      siblingIndex: number = 0,
      totalSiblings: number = 1
    ): { nodes: Node[]; edges: Edge[] } => {
      const resultNodes: Node[] = [];
      const resultEdges: Edge[] = [];

      const horizontalSpacing = 220;
      const verticalSpacing = 120;

      data.forEach((node, index) => {
        const totalWidth = data.length * horizontalSpacing;
        const startX = -totalWidth / 2 + horizontalSpacing / 2;
        const x = startX + index * horizontalSpacing;
        const y = level * verticalSpacing;

        const flowNode: Node = {
          id: node.id,
          type: 'employee',
          position: { x, y },
          data: {
            id: node.id,
            full_name: node.full_name,
            position: node.position,
            department: node.department,
            profile_photo_url: node.profile_photo_url,
            work_email: node.work_email,
          },
        };

        resultNodes.push(flowNode);

        if (parentId) {
          resultEdges.push({
            id: `e-${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            type: 'smoothstep',
            style: { stroke: '#6366f1', strokeWidth: 2 },
            animated: false,
          });
        }

        if (node.children && node.children.length > 0) {
          const childElements = convertToFlowElementsRecursive(
            node.children,
            node.id,
            level + 1,
            x
          );
          resultNodes.push(...childElements.nodes);
          resultEdges.push(...childElements.edges);
        }
      });

      return { nodes: resultNodes, edges: resultEdges };
    },
    []
  );

  const convertToFlowElementsRecursive = (
    data: OrgChartNode[],
    parentId: string,
    level: number,
    parentX: number
  ): { nodes: Node[]; edges: Edge[] } => {
    const resultNodes: Node[] = [];
    const resultEdges: Edge[] = [];

    const horizontalSpacing = 220;
    const verticalSpacing = 120;

    const totalWidth = data.length * horizontalSpacing;
    const startX = parentX - totalWidth / 2 + horizontalSpacing / 2;

    data.forEach((node, index) => {
      const x = startX + index * horizontalSpacing;
      const y = level * verticalSpacing;

      const flowNode: Node = {
        id: node.id,
        type: 'employee',
        position: { x, y },
        data: {
          id: node.id,
          full_name: node.full_name,
          position: node.position,
          department: node.department,
          profile_photo_url: node.profile_photo_url,
          work_email: node.work_email,
        },
      };

      resultNodes.push(flowNode);

      resultEdges.push({
        id: `e-${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        type: 'smoothstep',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        animated: false,
      });

      if (node.children && node.children.length > 0) {
        const childElements = convertToFlowElementsRecursive(
          node.children,
          node.id,
          level + 1,
          x
        );
        resultNodes.push(...childElements.nodes);
        resultEdges.push(...childElements.edges);
      }
    });

    return { nodes: resultNodes, edges: resultEdges };
  };

  useEffect(() => {
    const fetchOrgChart = async () => {
      try {
        setLoading(true);
        const response = await orgchartService.getOrgChart();
        if (response.success) {
          setOrgData(response.data);
          const { nodes: flowNodes, edges: flowEdges } = convertToFlowElements(
            response.data
          );
          setNodes(flowNodes);
          setEdges(flowEdges);
        } else {
          toast.error("Erreur lors de la récupération de l'organigramme");
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Erreur lors de la récupération de l'organigramme";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgChart();
  }, [toast, convertToFlowElements, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    console.log('Node clicked:', {
      id: node.id,
      data: node.data,
      position: node.position,
    });
  }, []);

  const totalEmployees = useMemo(() => {
    const countNodes = (nodes: OrgChartNode[]): number => {
      return nodes.reduce((acc, node) => {
        return acc + 1 + (node.children ? countNodes(node.children) : 0);
      }, 0);
    };
    return countNodes(orgData);
  }, [orgData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Chargement de l'organigramme...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-primary">{totalEmployees}</span>{' '}
          employés • <span className="font-semibold text-primary">{orgData.length}</span>{' '}
          racine(s)
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Utilisez la molette pour zoomer, glissez pour naviguer
        </div>
      </div>

      <div
        className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-stroke dark:border-strokedark overflow-hidden"
        style={{ height: '600px' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Controls showInteractive={false} />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
        Cliquez sur un employé pour afficher ses informations dans la console
      </div>
    </div>
  );
}
