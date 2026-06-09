/**
 * Tool registry for devin/cascade integration
 * Registers Cascade Guardian search and analysis tools
 */
export declare const CASCADE_TOOLS: ({
    name: string;
    description: string;
    parameters: {
        query: {
            type: string;
            description: string;
            required: boolean;
        };
        domain: {
            type: string;
            description: string;
        };
        tags: {
            type: string;
            description: string;
        };
        system_layer: {
            type: string;
            description: string;
        };
        file_path_pattern: {
            type: string;
            description: string;
        };
        limit: {
            type: string;
            description: string;
        };
        function_name?: undefined;
        file_path?: undefined;
        max_depth?: undefined;
    };
} | {
    name: string;
    description: string;
    parameters: {
        function_name: {
            type: string;
            description: string;
            required: boolean;
        };
        file_path: {
            type: string;
            description: string;
        };
        query?: undefined;
        domain?: undefined;
        tags?: undefined;
        system_layer?: undefined;
        file_path_pattern?: undefined;
        limit?: undefined;
        max_depth?: undefined;
    };
} | {
    name: string;
    description: string;
    parameters: {
        function_name: {
            type: string;
            description: string;
            required: boolean;
        };
        file_path: {
            type: string;
            description: string;
        };
        max_depth: {
            type: string;
            description: string;
        };
        query?: undefined;
        domain?: undefined;
        tags?: undefined;
        system_layer?: undefined;
        file_path_pattern?: undefined;
        limit?: undefined;
    };
} | {
    name: string;
    description: string;
    parameters: {
        query?: undefined;
        domain?: undefined;
        tags?: undefined;
        system_layer?: undefined;
        file_path_pattern?: undefined;
        limit?: undefined;
        function_name?: undefined;
        file_path?: undefined;
        max_depth?: undefined;
    };
} | {
    name: string;
    description: string;
    parameters: {
        domain: {
            type: string;
            description: string;
        };
        limit: {
            type: string;
            description: string;
        };
        query?: undefined;
        tags?: undefined;
        system_layer?: undefined;
        file_path_pattern?: undefined;
        function_name?: undefined;
        file_path?: undefined;
        max_depth?: undefined;
    };
})[];
export declare class CascadeToolRegistry {
    private guardian;
    constructor(projectPath?: string);
    executeTool(toolName: string, parameters: any): Promise<any>;
    getTools(): ({
        name: string;
        description: string;
        parameters: {
            query: {
                type: string;
                description: string;
                required: boolean;
            };
            domain: {
                type: string;
                description: string;
            };
            tags: {
                type: string;
                description: string;
            };
            system_layer: {
                type: string;
                description: string;
            };
            file_path_pattern: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            function_name?: undefined;
            file_path?: undefined;
            max_depth?: undefined;
        };
    } | {
        name: string;
        description: string;
        parameters: {
            function_name: {
                type: string;
                description: string;
                required: boolean;
            };
            file_path: {
                type: string;
                description: string;
            };
            query?: undefined;
            domain?: undefined;
            tags?: undefined;
            system_layer?: undefined;
            file_path_pattern?: undefined;
            limit?: undefined;
            max_depth?: undefined;
        };
    } | {
        name: string;
        description: string;
        parameters: {
            function_name: {
                type: string;
                description: string;
                required: boolean;
            };
            file_path: {
                type: string;
                description: string;
            };
            max_depth: {
                type: string;
                description: string;
            };
            query?: undefined;
            domain?: undefined;
            tags?: undefined;
            system_layer?: undefined;
            file_path_pattern?: undefined;
            limit?: undefined;
        };
    } | {
        name: string;
        description: string;
        parameters: {
            query?: undefined;
            domain?: undefined;
            tags?: undefined;
            system_layer?: undefined;
            file_path_pattern?: undefined;
            limit?: undefined;
            function_name?: undefined;
            file_path?: undefined;
            max_depth?: undefined;
        };
    } | {
        name: string;
        description: string;
        parameters: {
            domain: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            query?: undefined;
            tags?: undefined;
            system_layer?: undefined;
            file_path_pattern?: undefined;
            function_name?: undefined;
            file_path?: undefined;
            max_depth?: undefined;
        };
    })[];
}
/**
 * Initialize Cascade Guardian tools for devin/cascade
 * Call this during devin/cascade startup
 */
export declare function initializeCascadeTools(projectPath?: string): CascadeToolRegistry;
//# sourceMappingURL=tool-registry.d.ts.map