using Pkg
Pkg.activate(@__DIR__)
Pkg.instantiate()

using JuliaWorkspaces
using JuliaWorkspaces.URIs2: uri2filepath

jw = workspace_from_folders([pwd()])

files = get_text_files(jw)

for file in files
    diagnostics = get_diagnostic(jw, file)

    for diag in diagnostics
        if diag.severity == :error || diag.severity == :warning
            text_file = get_text_file(jw, file)

            start_pos = position_at(text_file.content, diag.range[1])
            end_pos = position_at(text_file.content.diag.range[2])
            println("::$(diag.severity) file=$(uri2filepath(file)),line=$(start_pos[1]),endLine=$(end_pos[1]),col=$(start_pos[2]),endColumn=$(end_pos[2]),title=$(diag.source)::$(diag.message)")
        end
    end
end
